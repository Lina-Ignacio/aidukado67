from fastapi import FastAPI, Request
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
    exam
)




from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Initialize limiter and app
limiter = Limiter(key_func=get_remote_address)
app = FastAPI()

# ✅ 1. Add CORS middleware FIRST
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ 2. Add rate limiting setup AFTER CORS
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.middleware("http")
@limiter.limit("1000/hour")
async def global_rate_limit(request: Request, call_next):
    return await call_next(request)

# ✅ 3. Include routers LAST
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(subject.router)
app.include_router(classes.router)
app.include_router(class_enrollment.router)
app.include_router(material.router)
#app.include_router(post_test.router)
app.include_router(logout.router)
app.include_router(quiz.router)
app.include_router(student_quiz_progress.router)
app.include_router(student_submission.router)
app.include_router(lesson_content.router)
app.include_router(exam.router)
