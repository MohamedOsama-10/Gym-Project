# app/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings
import urllib
import sys
import logging

logger = logging.getLogger(__name__)


def get_connection_string():
    """Build connection string for SQL Server."""
    db_name = settings.corrected_db_name

    if settings.DB_PASSWORD and settings.DB_PASSWORD.strip():
        # SQL Authentication (Azure SQL / production)
        params = urllib.parse.quote_plus(
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={settings.DB_SERVER};"
            f"DATABASE={db_name};"
            f"UID={settings.DB_USER};"
            f"PWD={settings.DB_PASSWORD};"
            f"Encrypt=yes;"
            f"TrustServerCertificate=no;"
            f"Connection Timeout=60;"
        )
    else:
        # Windows Authentication (local development)
        params = urllib.parse.quote_plus(
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={settings.DB_SERVER};"
            f"DATABASE={db_name};"
            f"Trusted_Connection=yes;"
            f"Encrypt=no;"
            f"TrustServerCertificate=yes;"
        )
    return f"mssql+pyodbc:///?odbc_connect={params}"


_engine = None
_SessionLocal = None
Base = declarative_base()


def get_engine():
    """Lazy initialization of the SQLAlchemy engine."""
    global _engine
    if _engine is None:
        if not settings.DB_SERVER or not settings.DB_NAME:
            raise ValueError(
                "DB_SERVER or DB_NAME not configured. "
                "Set these in Railway › Variables before deploying."
            )
        try:
            _engine = create_engine(
                get_connection_string(),
                echo=False,
                pool_pre_ping=True,
                pool_recycle=300 if settings.is_azure_sql else 3600,
                pool_size=5,
                max_overflow=10,
            )
        except Exception as _db_init_err:
            logger.error(f"DATABASE INIT FAILED: {_db_init_err}")
            logger.error("   → Set DB_SERVER, DB_NAME, DB_USER, DB_PASSWORD in environment variables")
            raise
    return _engine


def get_session_local():
    """Lazy initialization of the SessionLocal factory."""
    global _SessionLocal
    if _SessionLocal is None:
        engine = get_engine()
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return _SessionLocal


def get_db():
    SessionLocal = get_session_local()
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
