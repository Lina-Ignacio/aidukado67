from fastapi import FastAPI, Request
from contextlib import asynccontextmanager
from .routers.upload import teacher_router
import app.models  
from .routers import (
    material,
    post_test,
    auth,
    logout,
    user,
    subject,
    classes,
    class_enrollment,
    quiz,
    student_quiz_progress,
    student_submission,
    lesson_content,
    exam,
    student_exam_progress,
    exam_reopen,
    export_scores,
    student_task_reopen,
    student_quiz_reopen,
    audit_log,
    academic_semester_year
)

from dotenv import load_dotenv
from pathlib import Path

from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from sqlalchemy import text
from app.middleware.audit_middleware import AuditMiddleware

# Import limiter from dependencies instead
from app.dependencies import limiter

# Import your database engine
from app.database import engine
import time
import os

env_path = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=env_path, override=True)

# lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup - simple message only
    print("🚀 Starting Aidukado API with Neon database...")
    
    # Optional: Quick test without retries
    try:
        # Use begin() instead of connect() for NullPool
        with engine.begin() as conn:
            conn.execute(text("SELECT 1"))
        print("✓ Database connection ready")
    except Exception as e:
        print(f"⚠ Database connection will establish on demand: {str(e)[:100]}")
    
    yield  # App runs here
    
    # Shutdown
    print("👋 Shutting down...")
    try:
        engine.dispose()
    except Exception:
        pass

app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:5173",          
    "https://aidukado67.vercel.app",    
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,            
    allow_credentials=True,
    allow_methods=["*"],               
    allow_headers=["*"],
    expose_headers=["*"],  
)

app.add_middleware(AuditMiddleware)
# ✅ Add SlowAPI middleware
app.add_middleware(SlowAPIMiddleware)

# ✅ Set up rate limiting exception handlers
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ✅ Include routers
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(subject.router)
app.include_router(classes.router)
app.include_router(class_enrollment.router)
app.include_router(material.router)
app.include_router(logout.router)
app.include_router(quiz.router)
app.include_router(student_quiz_progress.router)
app.include_router(student_submission.router)
app.include_router(lesson_content.router)
app.include_router(exam.router)
app.include_router(student_exam_progress.router)
app.include_router(exam_reopen.router)
app.include_router(export_scores.router)
app.include_router(student_task_reopen.router)
app.include_router(student_quiz_reopen.router)
app.include_router(audit_log.router)
app.include_router(academic_semester_year.router)

# ✅ Health check - NO RATE LIMIT (for monitoring/pinger)
@app.get("/")
@limiter.exempt
def health():
    return {"status": "ok"}

# ✅ Health check - NO RATE LIMIT (for monitoring/pinger)
@app.get("/health")
@limiter.exempt
def health_check():
    """Health check endpoint"""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}
    
# ✅ Detailed database health check - NO RATE LIMIT
@app.get("/neon-health")
@limiter.exempt
def neon_health_check():
    """Check Neon database connection with details"""
    import time
    start = time.time()
    
    try:
        with engine.connect() as conn:
            # Get database info in separate queries
            db_name = conn.execute(text("SELECT current_database()")).fetchone()[0]
            db_user = conn.execute(text("SELECT current_user")).fetchone()[0]
            db_host = conn.execute(text("SELECT inet_server_addr()")).fetchone()[0]
            db_port = conn.execute(text("SELECT inet_server_port()")).fetchone()[0]
            db_version = conn.execute(text("SELECT version()")).fetchone()[0]
            
            # Test query performance
            conn.execute(text("SELECT 1"))
            
            latency = time.time() - start
            
            return {
                "status": "healthy",
                "database": "neon",
                "latency_ms": round(latency * 1000, 2),
                "details": {
                    "db_name": db_name,
                    "user": db_user,
                    "host": db_host,
                    "port": db_port,
                    "version": db_version,
                }
            }
            
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "neon",
            "error": str(e),
            "latency_ms": round((time.time() - start) * 1000, 2)
        }