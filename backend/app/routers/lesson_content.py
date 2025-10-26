from fastapi import APIRouter, Depends, HTTPException
from app.database import SessionLocal
from sqlalchemy.orm import Session
from app.models.lesson_content import LessonContent
from app.schemas.lesson_content import LessonOut

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        print(f"Database error: {e}")
        raise   # 👈 re-raise so FastAPI sees the error
    finally:
        db.close()

@router.get('/getLesson/{materialId}', response_model = LessonOut)
def get_lesson(materialId: int, db:Session = Depends(get_db)):
    lesson = db.query(LessonContent).filter(LessonContent.material_id == materialId).first()

    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    return lesson



