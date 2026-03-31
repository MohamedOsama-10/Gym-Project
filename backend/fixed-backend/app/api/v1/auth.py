# app/api/v1/auth.py
import logging
import re
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime, timedelta
from app.database import get_db
from app.schemas.auth import (
    UserSignupRequest,
    UserResponse,
    UserLoginRequest,
    TokenResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    MessageResponse
)
from app.models.user import User
from app.models.customer import Customer
from app.models.coach import Coach
from app.models.admin import Admin
from app.models.owner import Owner
from app.models.token_blacklist import TokenBlacklist
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    create_reset_token,
    verify_reset_token,
    verify_refresh_token
)
from app.services.email_service import send_reset_password_email
from jose import jwt, JWTError
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

PASSWORD_REGEX = re.compile(r'^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};\':\"\\|,.<>\/?]).{8,}$')


def _validate_password_strength(password: str) -> None:
    """Raise HTTPException if password does not meet complexity requirements."""
    if not PASSWORD_REGEX.match(password):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Password must be at least 8 characters and include "
                "at least one uppercase letter, one number, and one special character."
            )
        )


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user_data: UserSignupRequest, db: Session = Depends(get_db)):
    """Register a new user. Membership ID links to a pre-created admin record."""
    try:
        _validate_password_strength(user_data.password)

        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        membership_id = getattr(user_data, 'membership_id', None)
        role_value = user_data.role.value if hasattr(user_data.role, 'value') else user_data.role

        if role_value == "user" and not membership_id:
            raise HTTPException(
                status_code=400,
                detail="Membership ID is required. Please enter the ID provided by your gym admin."
            )

        if membership_id:
            membership_id = str(membership_id).strip()
            customer_match = db.query(Customer).filter(Customer.membership_id == membership_id).first()
            placeholder_pattern = f"PENDING_{membership_id}_%@system.gym"
            staff_match = db.query(User).filter(User.email.like(placeholder_pattern)).first()

            if not customer_match and not staff_match:
                raise HTTPException(
                    status_code=400,
                    detail="Membership ID not found. Please check your ID or contact your gym admin."
                )

            if customer_match:
                owner = db.query(User).filter(User.id == customer_match.user_id).first()
                if owner and owner.email and "@system.gym" not in owner.email:
                    raise HTTPException(status_code=400, detail="This Membership ID has already been claimed.")
            if staff_match and "@system.gym" not in staff_match.email:
                raise HTTPException(status_code=400, detail="This Staff ID has already been claimed.")

        phone_value = getattr(user_data, 'phone', None)
        if phone_value:
            phone_value = phone_value.strip() or None

        new_user = User(
            full_name=user_data.full_name,
            email=user_data.email,
            password_hash=hash_password(user_data.password),
            role=role_value,
            phone=phone_value
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        user_id = new_user.id
        user_email = new_user.email
        user_phone = new_user.phone

        # Link to pre-created membership/staff record if applicable
        if membership_id:
            membership_id = str(membership_id).strip()
            pre_customer = db.query(Customer).filter(Customer.membership_id == membership_id).first()
            if pre_customer:
                pre_user = db.query(User).filter(User.id == pre_customer.user_id).first()
                if pre_user:
                    pre_user.full_name = user_data.full_name
                    pre_user.email = user_data.email
                    pre_user.password_hash = hash_password(user_data.password)
                    pre_user.is_active = True
                    pre_customer.full_name = user_data.full_name
                    pre_customer.email = user_data.email
                    db.delete(new_user)
                    db.commit()
                    db.refresh(pre_user)
                    return {"id": pre_user.id, "full_name": pre_user.full_name, "email": pre_user.email,
                            "role": pre_user.role, "phone": pre_user.phone, "is_active": True, "created_at": pre_user.created_at}

            placeholder_pattern = f"PENDING_{membership_id}_%@system.gym"
            pre_staff = db.query(User).filter(User.email.like(placeholder_pattern)).first()
            if pre_staff:
                pre_staff.full_name = user_data.full_name
                pre_staff.email = user_data.email
                pre_staff.password_hash = hash_password(user_data.password)
                pre_staff.is_active = True
                db.delete(new_user)
                db.commit()
                db.refresh(pre_staff)
                return {"id": pre_staff.id, "full_name": pre_staff.full_name, "email": pre_staff.email,
                        "role": pre_staff.role, "phone": pre_staff.phone, "is_active": True, "created_at": pre_staff.created_at}

        # Create role profile
        if role_value == "coach":
            _ensure_profile_exists(db, "coaches", user_id, user_email, {
                "experience_years": 0, "hourly_rate": 0.0, "gym_id": None
            })
        elif role_value == "user":
            _ensure_customer_profile_exists(db, user_id, user_email, user_phone, user_data)
        elif role_value == "owner":
            _ensure_profile_exists(db, "owners", user_id, user_email, {
                "company_name": "My Gym", "business_registration": None, "emergency_contact": None
            })
        elif role_value == "admin":
            _ensure_profile_exists(db, "admins", user_id, user_email, {
                "gym_id": None, "department": "General", "permissions": None,
                "employee_id": None, "hire_date": None, "is_super_admin": 0
            })

        return {"id": user_id, "full_name": new_user.full_name, "email": user_email,
                "role": new_user.role, "phone": user_phone, "is_active": True, "created_at": new_user.created_at}

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating user: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")


def _ensure_profile_exists(db, table_name, user_id, user_email, default_values):
    # SAFETY: table_name is always a hardcoded string literal at every call site in this file.
    # Never pass user-supplied input as table_name.
    columns = ["user_id"] + list(default_values.keys()) + ["created_at"]
    values_placeholders = [":user_id"] + [f":{k}" for k in default_values.keys()] + ["SYSDATETIMEOFFSET()"]
    sql = text(f"""
        BEGIN TRY
            INSERT INTO {table_name} ({', '.join(columns)})
            VALUES ({', '.join(values_placeholders)});
        END TRY
        BEGIN CATCH
            IF ERROR_NUMBER() = 2627
                PRINT 'Profile already exists, skipping.';
            ELSE
                THROW;
        END CATCH;
    """)
    params = {"user_id": user_id}
    params.update(default_values)
    try:
        db.execute(sql, params)
        db.commit()
    except Exception as e:
        if "2627" in str(e) or "duplicate key" in str(e).lower():
            db.rollback()
        else:
            raise


def _ensure_customer_profile_exists(db, user_id, user_email, user_phone, user_data):
    height = getattr(user_data, 'height', None)
    weight = getattr(user_data, 'weight', None)
    weight_goal = getattr(user_data, 'weight_goal', None)
    goal = getattr(user_data, 'goal', None)

    existing = db.query(Customer).filter(Customer.user_id == user_id).first()
    if existing:
        existing.phone = user_phone
        existing.full_name = user_data.full_name
        existing.email = user_data.email
        if height is not None: existing.height = height
        if weight is not None: existing.weight = weight
        if weight_goal is not None: existing.weight_goal = weight_goal
        if goal is not None: existing.goal = goal
        db.commit()
        return

    try:
        insert_sql = text("""
            INSERT INTO customers (
                user_id, gym_id, height, weight, goal, weight_goal,
                membership_id, assigned_coach_id, joined_date,
                full_name, email, phone,
                date_of_birth, gender, bio, avatar_url,
                emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
                notifications_enabled, email_updates_enabled, public_profile, created_at, updated_at
            ) VALUES (
                :user_id, NULL, :height, :weight, :goal, :weight_goal,
                NULL, NULL, NULL,
                :full_name, :email, :phone,
                NULL, NULL, NULL, NULL,
                NULL, NULL, NULL,
                1, 1, 0, SYSDATETIMEOFFSET(), NULL
            )
        """)
        db.execute(insert_sql, {
            "user_id": user_id, "height": height, "weight": weight,
            "weight_goal": weight_goal, "goal": goal,
            "full_name": user_data.full_name, "email": user_data.email, "phone": user_phone
        })
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = db.query(Customer).filter(Customer.user_id == user_id).first()
        if existing:
            existing.phone = user_phone
            existing.full_name = user_data.full_name
            existing.email = user_data.email
            db.commit()


class ClaimAccountRequest(BaseModel):
    membership_id: str
    full_name: str
    email: str
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if not PASSWORD_REGEX.match(v):
            raise ValueError(
                "Password must be at least 8 characters and include "
                "an uppercase letter, a number, and a special character."
            )
        return v


@router.post("/claim-account", response_model=TokenResponse)
def claim_account(data: ClaimAccountRequest, db: Session = Depends(get_db)):
    user = None
    customer = None
    customer = db.query(Customer).filter(Customer.membership_id == data.membership_id).first()
    if customer:
        user = db.query(User).filter(User.id == customer.user_id).first()
    else:
        placeholder_pattern = f"PENDING_{data.membership_id}_%@system.gym"
        user = db.query(User).filter(User.email.like(placeholder_pattern)).first()

    if not user:
        raise HTTPException(status_code=400, detail="ID not found. Please check with your gym admin.")
    if user.email and "@system.gym" not in user.email:
        raise HTTPException(status_code=400, detail="This ID has already been claimed. Please log in instead.")

    existing = db.query(User).filter(User.email == data.email, User.id != user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")

    user.full_name = data.full_name
    user.email = data.email
    user.password_hash = hash_password(data.password)
    user.is_active = True

    if customer:
        customer.full_name = data.full_name
        customer.email = data.email
    if user.role == "coach":
        coach = db.query(Coach).filter(Coach.user_id == user.id).first()
        if coach:
            coach.is_available = True

    db.commit()
    db.refresh(user)

    access_token = create_access_token(data={"sub": user.email, "user_id": user.id, "role": user.role})
    refresh_token = create_refresh_token(data={"sub": user.email, "user_id": user.id})

    return {
        "access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer",
        "user": {"id": user.id, "full_name": user.full_name, "email": user.email,
                 "role": user.role, "phone": user.phone, "is_active": True, "created_at": user.created_at},
    }


@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLoginRequest, db: Session = Depends(get_db)):
    """Login user and return JWT access token + refresh token."""
    user = db.query(User).filter(User.email == login_data.email).first()

    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    # Check account is active
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account is deactivated. Contact your gym admin.")

    access_token = create_access_token(data={"sub": user.email, "user_id": user.id, "role": user.role})
    refresh_token = create_refresh_token(data={"sub": user.email, "user_id": user.id})

    return {
        "access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer",
        "user": {"id": user.id, "full_name": user.full_name, "email": user.email,
                 "role": user.role, "phone": user.phone, "is_active": True, "created_at": user.created_at}
    }


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/refresh", response_model=dict)
def refresh_access_token(body: RefreshRequest, db: Session = Depends(get_db)):
    """Generate new access token using refresh token (sent in request body)."""
    email = verify_refresh_token(body.refresh_token)
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    blacklisted = db.query(TokenBlacklist).filter(TokenBlacklist.token == body.refresh_token).first()
    if blacklisted:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token has been revoked")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account is deactivated.")

    new_access_token = create_access_token(data={"sub": user.email, "user_id": user.id, "role": user.role})
    return {"access_token": new_access_token, "token_type": "bearer"}


class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None


@router.post("/logout", response_model=MessageResponse)
def logout(authorization: str = Header(...), body: Optional[LogoutRequest] = None, db: Session = Depends(get_db)):
    """Logout: blacklist access token and optionally refresh token."""
    try:
        access_token = authorization.replace("Bearer ", "")
        try:
            payload = jwt.decode(access_token, settings.SECRET_KEY,
                                 algorithms=[settings.ALGORITHM], options={"verify_exp": False})
            exp_timestamp = payload.get("exp")
            expires_at = datetime.fromtimestamp(exp_timestamp) if exp_timestamp else datetime.utcnow()
        except JWTError:
            return {"message": "Successfully logged out"}

        db.add(TokenBlacklist(token=access_token, expires_at=expires_at))

        refresh_token = body.refresh_token if body else None
        if refresh_token:
            try:
                rp = jwt.decode(refresh_token, settings.SECRET_KEY,
                                algorithms=[settings.ALGORITHM], options={"verify_exp": False})
                rexp = rp.get("exp")
                r_expires = datetime.fromtimestamp(rexp) if rexp else datetime.utcnow()
                db.add(TokenBlacklist(token=refresh_token, expires_at=r_expires))
            except JWTError:
                pass

        db.commit()
    except Exception:
        db.rollback()
    return {"message": "Successfully logged out"}


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Send password reset email. Always returns same message to prevent email enumeration."""
    generic_response = {"message": "If your email is registered, you will receive a password reset link"}
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        return generic_response

    reset_token = create_reset_token(user.email)
    email_sent = send_reset_password_email(email=user.email, token=reset_token, user_name=user.full_name)
    if not email_sent:
        raise HTTPException(status_code=500, detail="Failed to send reset email. Please try again later.")
    return generic_response


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset user password using token from email."""
    _validate_password_strength(request.new_password)
    email = verify_reset_token(request.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(request.new_password)
    db.commit()
    return {"message": "Password successfully reset"}
