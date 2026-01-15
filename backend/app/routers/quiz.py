from fastapi import APIRouter, Depends, HTTPException, Form, Query
from app.database import SessionLocal
from sqlalchemy.orm import Session
from app.models.quiz import Quiz
from app.schemas.quiz import CreateQuiz, QuizOut
from ..utils.generate_quiz import generate_quiz
from app.models.lesson_content import LessonContent
from app.models.class_material import ClassMaterial
from app.models.student_quiz_progress import StudentQuizProgress
from app.models.users import Users
from app.models.class_enrollment import ClassEnrollment
from app.models.quiz_attempts import StartTime
from app.schemas.quiz_attempts import CreateStartTime
from datetime import datetime
from sqlalchemy import desc

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

#get generated quiz
@router.post("/generateQuiz")
async def gen_quiz(lesson: str = Form(...), items: int = Form(...), question_type: str = Form(...)):
    questions = await generate_quiz(lesson, items, question_type)    
    return {"quiz": questions}

@router.post('/assignQuiz')
def assign_quiz(quiz: CreateQuiz, db: Session = Depends(get_db)):

    new_quiz = Quiz(
        lesson_id = quiz.lesson_id,
        title = quiz.title,
        total_points = quiz.total_points,
        instructions = quiz.instructions,
        quiz_content = quiz.quiz_content,
        # start_time = quiz.start_time,
        duration = quiz.duration,
        class_id = quiz.class_id,
        is_archive = quiz.is_archive,
        assessment_type = quiz.assessment_type,
        term_id = quiz.term_id
    )
    db.add(new_quiz)
    db.commit()
    db.refresh(new_quiz)
    print(new_quiz.term_id)
    return {"message": "Quiz saved successfully"}

#get quiz from database
@router.get('/getQuiz/{quizId}', response_model = QuizOut)
def get_quiz(quizId: int, db:Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quizId).first()

    if not quiz:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    return quiz

@router.get('/getQuizzes/{classId}', response_model=list[QuizOut])
def get_quizzes(classId: int, term: int = Query(...), db: Session = Depends(get_db)):
    try:
        quizzes = db.query(Quiz).filter(
            Quiz.class_id == classId, 
            Quiz.term_id == term, 
            Quiz.is_archive == False
        ).order_by(desc(Quiz.created_at)).all()

        if not quizzes:
            raise HTTPException(status_code=404, detail="No quizzes found")

        return quizzes

    except Exception as e:
        
        print(f"Error occurred: {e}")  
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.patch('/archiveQuiz/{quiz_id}')
def archive_quiz(quiz_id: int, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    quiz.is_archive = True  
    db.commit()
    db.refresh(Quiz)             
    return {"message": "Archived successfully"}

@router.get('/quizMonitoring/{quizId}')
def quiz_monitoring(quizId: int, db: Session = Depends(get_db)):

    header_info = (
        db.query(Quiz.title, ClassMaterial.title.label("material_title"))
        .join(LessonContent, Quiz.lesson_id == LessonContent.id)
        .join(ClassMaterial, LessonContent.material_id == ClassMaterial.id)
        .filter(Quiz.id == quizId)
        .first()
    )

    if not header_info:
        raise HTTPException(status_code=404, detail="Quiz or associated lesson not found")

    results = (
        db.query(Users.first_name, Users.last_name, StudentQuizProgress.score)
        .join(StudentQuizProgress, StudentQuizProgress.student_id == Users.id)
        .filter(StudentQuizProgress.quiz_id == quizId)
        .all()
    )

    return {
        "quizTitle": header_info.title,
        "lessonTitle": header_info.material_title,
        "scores": [{"studentName": f"{r.first_name} {r.last_name}", "score": r.score} for r in results]
    }

@router.get('/getStudentsByClass/{class_id}')
def getStudents(class_id: int, db: Session = Depends(get_db)):
    getStudents = (
     db.query(Users.id, Users.first_name, Users.last_name)
    .join(ClassEnrollment, ClassEnrollment.student_id == Users.id)
    .filter(ClassEnrollment.class_id == class_id).all()
    )

    return [
        {
            'id': s.id,
            'first_name': s.first_name,
            'last_name' : s.last_name
        }
        for s in getStudents
    ]



