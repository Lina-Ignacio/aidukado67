from app.database import SessionLocal
from sqlalchemy.orm import Session
from app.models.lesson_content import LessonContent

def get_lesson_content(lesson_id: int):
    db: Session = SessionLocal()

    try:
        lesson = (
            db.query(LessonContent).filter(LessonContent.material_id == lesson_id).first()
        )
        return lesson.extracted_content
    finally:
        db.close()