# app/main.py
import os
import asyncio
import logging
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.v1 import (
    auth, availability, bookings, profile, gyms, subscriptions,
    admin_owner, admin, workouts, reviews, meals, memberships,
    coach, training_programs, chat, coach_trainees, admin_profile,
    coach_packages, notifications, users,
)
from app.database import engine, Base
from app.config import settings
from app.models import conversation, subscription_request, notification

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# Global migration status — checked by /health
MIGRATION_STATUS = {"done": False, "error": None}

app = FastAPI(
    title="Gym Management API",
    version="1.0.0",
    description="Backend for gym management system",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
)

# ── Static files ───────────────────────────────────────────────────────────────
uploads_dir = "uploads"
os.makedirs(os.path.join(uploads_dir, "avatars"), exist_ok=True)
os.makedirs(os.path.join(uploads_dir, "chat"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


# ── Register all routers (one place, after middleware) ────────────────────────
app.include_router(auth.router,             prefix="/api/v1")
app.include_router(users.router,            prefix="/api/v1")
app.include_router(availability.router,     prefix="/api/v1")
app.include_router(bookings.router,         prefix="/api/v1")
app.include_router(profile.router,          prefix="/api/v1")
app.include_router(gyms.router,             prefix="/api/v1")
app.include_router(subscriptions.router,    prefix="/api/v1")
app.include_router(admin_owner.router,      prefix="/api/v1")
app.include_router(admin.router,            prefix="/api/v1")
app.include_router(workouts.router,         prefix="/api/v1")
app.include_router(meals.router,            prefix="/api/v1")
app.include_router(chat.router,             prefix="/api/v1")
app.include_router(reviews.router,          prefix="/api/v1")
app.include_router(memberships.router,      prefix="/api/v1")
app.include_router(coach.router,            prefix="/api/v1")
app.include_router(training_programs.router,prefix="/api/v1")
app.include_router(coach_trainees.router,   prefix="/api/v1")
app.include_router(admin_profile.router,    prefix="/api/v1")
app.include_router(coach_packages.router,   prefix="/api/v1")
app.include_router(notifications.router,    prefix="/api/v1")


# ── Global exception handler ───────────────────────────────────────────────────
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    import traceback
    logger.error(f"Unhandled exception: {exc}\n{traceback.format_exc()}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# ── Startup: run DB migrations in background ───────────────────────────────────
@app.on_event("startup")
async def run_migrations():
    asyncio.create_task(_run_migrations_background())


async def _run_migrations_background():
    global MIGRATION_STATUS
    logger.info("=" * 60)
    logger.info("DATABASE STARTUP (background)")
    logger.info(f"DB_SERVER: {settings.DB_SERVER}")
    logger.info(f"DB_NAME:   {settings.DB_NAME}")
    logger.info("=" * 60)

    def do_all_migrations():
        logger.info("Connecting to database...")
        with engine.connect() as test_conn:
            result = test_conn.execute(text("SELECT DB_NAME()"))
            db_name = result.scalar()
            logger.info(f"Connected to: {db_name}")

        logger.info("Creating/verifying tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Tables ready")

        logger.info("Running migrations...")
        with engine.begin() as conn:

            def ensure_column(table, col, sql):
                try:
                    conn.execute(text(f"""
                        IF NOT EXISTS (
                            SELECT * FROM sys.columns
                            WHERE object_id = OBJECT_ID(N'{table}') AND name = N'{col}'
                        )
                        {sql}
                    """))
                    logger.info(f"  ✅ {table}.{col}")
                except Exception as e:
                    logger.warning(f"  ⚠️  {table}.{col}: {e}")

            # Conversations
            ensure_column("conversations", "coach_user_id",
                "ALTER TABLE conversations ADD coach_user_id INT NULL REFERENCES users(id)")
            ensure_column("conversations", "customer_user_id",
                "ALTER TABLE conversations ADD customer_user_id INT NULL REFERENCES users(id)")

            try:
                conn.execute(text("""
                    DECLARE @kc NVARCHAR(255)
                    SELECT TOP 1 @kc = kc.name
                    FROM sys.key_constraints kc
                    JOIN sys.index_columns ic ON kc.parent_object_id = ic.object_id AND kc.unique_index_id = ic.index_id
                    JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
                    WHERE kc.parent_object_id = OBJECT_ID('conversations')
                      AND kc.type = 'UQ'
                      AND c.name IN ('participant1_id', 'participant2_id')
                    IF @kc IS NOT NULL
                        EXEC('ALTER TABLE conversations DROP CONSTRAINT [' + @kc + ']')
                """))
            except Exception as e:
                logger.warning(f"  Drop constraint: {e}")

            # Chat messages
            ensure_column("chat_messages", "media_url", "ALTER TABLE chat_messages ADD media_url NVARCHAR(MAX) NULL")
            ensure_column("chat_messages", "conversation_id", "ALTER TABLE chat_messages ADD conversation_id INT NULL REFERENCES conversations(id)")
            ensure_column("chat_messages", "sender_user_id", "ALTER TABLE chat_messages ADD sender_user_id INT NULL REFERENCES users(id)")
            ensure_column("chat_messages", "is_read", "ALTER TABLE chat_messages ADD is_read BIT NOT NULL DEFAULT 0")

            try:
                conn.execute(text("""
                    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('chat_messages') AND name = 'text')
                    ALTER TABLE chat_messages ALTER COLUMN text NVARCHAR(MAX) NULL
                """))
            except Exception as e:
                logger.warning(f"  chat_messages.text: {e}")

            # Meal logs
            ensure_column("meal_logs", "log_date", "ALTER TABLE meal_logs ADD log_date DATE NULL")
            ensure_column("meal_logs", "log_time", "ALTER TABLE meal_logs ADD log_time TIME NULL")
            ensure_column("meal_logs", "logged_at", "ALTER TABLE meal_logs ADD logged_at DATETIMEOFFSET NULL DEFAULT SYSDATETIMEOFFSET()")
            ensure_column("meal_logs", "notes", "ALTER TABLE meal_logs ADD notes NVARCHAR(500) NULL")

            # Coaches
            for col, sql in [
                ("avatar_url", "NVARCHAR(500)"),
                ("bio", "NVARCHAR(2000)"),
                ("social_youtube", "NVARCHAR(200)"),
                ("cv_url", "NVARCHAR(500)"),
            ]:
                ensure_column("coaches", col, f"ALTER TABLE coaches ADD {col} {sql} NULL")

            # Admins / Owners / Gyms
            ensure_column("admins", "gym_id", "ALTER TABLE admins ADD gym_id INT NULL")
            ensure_column("admins", "avatar_url", "ALTER TABLE admins ADD avatar_url NVARCHAR(500) NULL")
            ensure_column("owners", "avatar_url", "ALTER TABLE owners ADD avatar_url NVARCHAR(500) NULL")
            for col, sql in [("phone", "NVARCHAR(20)"), ("image_url", "NVARCHAR(500)"), ("description", "NVARCHAR(MAX)")]:
                ensure_column("gyms", col, f"ALTER TABLE gyms ADD {col} {sql} NULL")
            ensure_column("gyms", "is_active", "ALTER TABLE gyms ADD is_active BIT NOT NULL DEFAULT 1")
            ensure_column("gyms", "total_members", "ALTER TABLE gyms ADD total_members INT NULL DEFAULT 0")
            ensure_column("gyms", "active_members", "ALTER TABLE gyms ADD active_members INT NULL DEFAULT 0")
            ensure_column("gyms", "total_coaches", "ALTER TABLE gyms ADD total_coaches INT NULL DEFAULT 0")

            # Customers
            for col, sql in [
                ("email", "NVARCHAR(100)"),
                ("full_name", "NVARCHAR(255)"),
                ("phone", "NVARCHAR(50)"),
                ("avatar_url", "NVARCHAR(500)"),
                ("assigned_coach_id", "INT NULL REFERENCES coaches(id)"),
            ]:
                ensure_column("customers", col, f"ALTER TABLE customers ADD {col} {sql}")

            # Subscriptions
            for col, sql in [
                ("plan_name", "NVARCHAR(100)"),
                ("plan_type", "NVARCHAR(50)"),
                ("coach_package_id", "INT NULL REFERENCES coach_packages(id)"),
                ("sessions_remaining", "INT"),
            ]:
                ensure_column("subscriptions", col, f"ALTER TABLE subscriptions ADD {col} {sql}")

            # Nutrition goals / Meals / Coach packages / Membership plans
            for col, sql in [
                ("updated_at", "DATETIMEOFFSET"),
                ("created_at", "DATETIMEOFFSET NULL DEFAULT SYSDATETIMEOFFSET()"),
                ("calories", "INT NULL DEFAULT 2000"),
                ("protein", "FLOAT NULL DEFAULT 150"),
                ("carbs", "FLOAT NULL DEFAULT 250"),
                ("fats", "FLOAT NULL DEFAULT 70"),
            ]:
                ensure_column("nutrition_goals", col.split()[0], f"ALTER TABLE nutrition_goals ADD {col}")

            for col, sql in [
                ("customer_id", "INT NULL REFERENCES customers(id)"),
                ("is_favorite", "BIT NULL DEFAULT 0"),
                ("is_custom", "BIT NULL DEFAULT 1"),
                ("type", "NVARCHAR(20) NULL DEFAULT 'other'"),
                ("name", "NVARCHAR(200)"),
                ("calories", "INT NULL DEFAULT 0"),
                ("protein", "FLOAT NULL DEFAULT 0"),
                ("carbs", "FLOAT NULL DEFAULT 0"),
                ("fats", "FLOAT NULL DEFAULT 0"),
                ("image_url", "NVARCHAR(500)"),
                ("ingredients", "NVARCHAR(MAX)"),
                ("created_at", "DATETIMEOFFSET NULL DEFAULT SYSDATETIMEOFFSET()"),
            ]:
                ensure_column("meals", col, f"ALTER TABLE meals ADD {col} {sql}")

            ensure_column("coach_packages", "status", "ALTER TABLE coach_packages ADD status NVARCHAR(20) NOT NULL DEFAULT 'pending'")
            ensure_column("coach_packages", "rejection_reason", "ALTER TABLE coach_packages ADD rejection_reason NVARCHAR(500) NULL")
            ensure_column("membership_plans", "description", "ALTER TABLE membership_plans ADD description NVARCHAR(MAX) NULL")

            # subscription_requests table
            try:
                conn.execute(text("""
                    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'subscription_requests')
                    CREATE TABLE subscription_requests (
                        id INT PRIMARY KEY IDENTITY(1,1),
                        customer_id INT NOT NULL REFERENCES customers(id),
                        plan_id INT NULL REFERENCES membership_plans(id),
                        coach_package_id INT NULL REFERENCES coach_packages(id),
                        plan_name NVARCHAR(100) NOT NULL,
                        requested_price FLOAT NOT NULL DEFAULT 0,
                        discount FLOAT NOT NULL DEFAULT 0,
                        discount_pct FLOAT NOT NULL DEFAULT 0,
                        final_price FLOAT NULL,
                        status NVARCHAR(20) NOT NULL DEFAULT 'pending',
                        notes NVARCHAR(500) NULL,
                        approved_by INT NULL REFERENCES users(id),
                        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
                        updated_at DATETIMEOFFSET NULL
                    )
                """))
            except Exception as e:
                logger.warning(f"  subscription_requests: {e}")

            # admin_profiles and admin_reports tables
            try:
                conn.execute(text("""
                    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'admin_profiles')
                    CREATE TABLE admin_profiles (
                        id INT PRIMARY KEY IDENTITY(1,1),
                        admin_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                        full_name NVARCHAR(200) NULL,
                        email NVARCHAR(200) NULL,
                        phone NVARCHAR(50) NULL,
                        date_of_birth DATE NULL,
                        gender NVARCHAR(20) NULL,
                        gym_branch NVARCHAR(200) NULL,
                        address NVARCHAR(500) NULL,
                        emergency_contact_name NVARCHAR(200) NULL,
                        emergency_contact_phone NVARCHAR(50) NULL,
                        emergency_contact_relationship NVARCHAR(100) NULL,
                        profile_photo_path NVARCHAR(500) NULL,
                        updated_at DATETIME2 DEFAULT GETDATE()
                    )
                """))
            except Exception as e:
                logger.warning(f"  admin_profiles: {e}")

            try:
                conn.execute(text("""
                    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'admin_reports')
                    CREATE TABLE admin_reports (
                        id INT PRIMARY KEY IDENTITY(1,1),
                        admin_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        name NVARCHAR(200) NOT NULL,
                        type NVARCHAR(100) NOT NULL DEFAULT 'Custom',
                        period NVARCHAR(100) NULL,
                        description NVARCHAR(MAX) NULL,
                        created_at DATETIME2 DEFAULT GETDATE()
                    )
                """))
            except Exception as e:
                logger.warning(f"  admin_reports: {e}")

            # Token blacklist cleanup — remove expired tokens
            try:
                conn.execute(text("""
                    IF EXISTS (SELECT * FROM sys.tables WHERE name = 'token_blacklist')
                    DELETE FROM token_blacklist WHERE expires_at < SYSDATETIMEOFFSET()
                """))
                logger.info("  ✅ Cleaned up expired blacklisted tokens")
            except Exception as e:
                logger.warning(f"  token_blacklist cleanup: {e}")

        logger.info("All migrations completed")
        return True

    max_retries = 15
    base_delay = 5

    for attempt in range(max_retries):
        try:
            loop = asyncio.get_event_loop()
            await asyncio.wait_for(
                loop.run_in_executor(None, do_all_migrations),
                timeout=120
            )
            MIGRATION_STATUS["done"] = True
            break

        except asyncio.TimeoutError:
            logger.warning(f"Timeout on attempt {attempt + 1}")
            if attempt == max_retries - 1:
                MIGRATION_STATUS["error"] = "Database operations timed out"
                return

        except Exception as e:
            error_str = str(e).lower()
            is_transient = any([
                "cannot open database" in error_str,
                "not currently available" in error_str,
                "login failed" in error_str,
            ])
            if is_transient and attempt < max_retries - 1:
                wait_time = min(base_delay * (1.5 ** attempt), 60)
                logger.info(f"Retrying in {wait_time:.1f}s... (attempt {attempt + 1}/{max_retries})")
                await asyncio.sleep(wait_time)
            else:
                logger.error(f"Migration failed: {e}")
                MIGRATION_STATUS["error"] = str(e)
                return

    os.makedirs("uploads/profiles", exist_ok=True)
    logger.info("=" * 60)
    logger.info("STARTUP COMPLETE")
    logger.info("=" * 60)


@app.get("/")
def root():
    return {"message": "Gym Management API is running"}


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "migrations_done": MIGRATION_STATUS["done"],
        "migrations_error": MIGRATION_STATUS["error"],
        "version": "1.0.0",
        "environment": os.environ.get("RAILWAY_ENVIRONMENT", "local"),
        "database": f"{settings.DB_SERVER}/{settings.DB_NAME}",
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)
