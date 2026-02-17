from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import DATABASE_URL
from sqlalchemy.pool import NullPool
from app.context import current_user_id  # Import the context var
import logging

from app.middleware.audit_middleware import AuditMiddleware

logger = logging.getLogger(__name__)

engine = create_engine(
    DATABASE_URL,
    poolclass=NullPool,  
    pool_pre_ping=True,
    pool_recycle=1800,
    connect_args={
        "sslmode": "require",
        "connect_timeout": 30,
        "keepalives": 1,
        "keepalives_idle": 60,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    }
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """
    Database dependency that sets the user ID in PostgreSQL session
    """
    db = SessionLocal()
    try:
        # Get the current user ID from context var (set by middleware)
        user_id = current_user_id.get()
        
        if user_id:
            # Set PostgreSQL session parameter for audit logging
            db.execute(text(f"SET audit.user_id = {user_id}"))
            db.commit()
            logger.debug(f"Set audit.user_id = {user_id} for session")
        else:
            # Clear the PostgreSQL session parameter for unauthenticated requests
            db.execute(text("RESET audit.user_id"))
            db.commit()
            logger.debug("Reset audit.user_id for session")
        
        yield db
        
    except Exception as e:
        logger.error(f"Database error: {e}")
        raise
    finally:
        db.close()
        logger.debug("Database session closed")