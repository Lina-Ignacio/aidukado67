from fastapi import APIRouter, Depends, HTTPException, Form
from app.database import SessionLocal
from sqlalchemy.orm import Session
from app.models.quiz import Quiz
from app.schemas.quiz import CreateQuiz, QuizOut
from ..utils.generate_pretest import generate_pretest

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
@router.post("/getQuiz")
async def get_quiz(lesson: str = Form(...), items: int = Form(...), type: str = Form(...)):
    questions = generate_pretest(lesson, items, type)    
    return {"pretest": questions}

@router.post('/assignQuiz')
def assign_quiz(quiz: CreateQuiz, db: Session = Depends(get_db)):

    new_quiz = Quiz(
        lesson_id = quiz.lesson_id,
        title = quiz.title,
        description = quiz.description,
        total_points = quiz.total_points,
        instructions = quiz.instructions,
        quiz_content = quiz.quiz_content,
        start_time = quiz.start_time,
        duration = quiz.duration,
        class_id = quiz.class_id
    )
    db.add(new_quiz)
    db.commit()
    db.refresh(new_quiz)

    return {"message": "Quiz saved successfully"}

#get quiz from database
@router.get('/getQuiz/{quizId}', response_model = QuizOut)
def get_quiz(quizId: int, db:Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quizId).first()

    if not quiz:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    return quiz

@router.get('/getQuizzes/{classId}', response_model=list[QuizOut])
def get_quizzes(classId: int, db: Session = Depends(get_db)):
    quizzes = db.query(Quiz).filter(Quiz.class_id == classId).all()

    if not quizzes:
        raise HTTPException(status_code=404, detail="No quizzes found for this class")

    return quizzes

