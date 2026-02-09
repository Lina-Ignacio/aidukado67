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
    student_task_reopen
)

from dotenv import load_dotenv
from pathlib import Path

from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text

# Import your database engine
from app.database import engine
import time

env_path = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=env_path, override=True)

# Initialize limiter BEFORE creating the app
limiter = Limiter(key_func=get_remote_address)

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
    "https://aidukado.vercel.app",    
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,            
    allow_credentials=True,
    allow_methods=["*"],               
    allow_headers=["*"],
    expose_headers=["*"],  
)


# ✅ Add rate limiting setup AFTER CORS
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.middleware("http")
@limiter.limit("1000/hour")
async def global_rate_limit(request: Request, call_next):
    return await call_next(request)

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

@app.get("/")
def health():
    return {"status": "ok"}

@app.get("/health")
def health_check():
    """Health check endpoint"""
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}
    
@app.get("/neon-health")
def neon_health_check():
    """Check Neon database connection with details"""
    import time
    start = time.time()
    
    try:
        with engine.connect() as conn:
            # ✅ FIXED: Execute queries separately
            # Get database info in separate queries
            db_name = conn.execute("SELECT current_database()").fetchone()[0]
            db_user = conn.execute("SELECT current_user").fetchone()[0]
            db_host = conn.execute("SELECT inet_server_addr()").fetchone()[0]
            db_port = conn.execute("SELECT inet_server_port()").fetchone()[0]
            db_version = conn.execute("SELECT version()").fetchone()[0]
            
            # Test query performance
            conn.execute("SELECT 1")
            
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