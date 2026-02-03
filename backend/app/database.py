from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import DATABASE_URL
from sqlalchemy.pool import NullPool  # IMPORTANT for Neon!

# For Neon, you MUST use NullPool
engine = create_engine(
    DATABASE_URL,
    poolclass=NullPool,  
    
    
    pool_pre_ping=True,
    pool_recycle=1800,
    
    # Add Neon-specific SSL settings
    connect_args={
        "sslmode": "require",  # Neon requires SSL
        "connect_timeout": 30,  # Increase for cloud
        "keepalives": 1,
        "keepalives_idle": 60,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    }
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()