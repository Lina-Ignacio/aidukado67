from fastapi import APIRouter, Depends, HTTPException, Form
from app.database import SessionLocal
from sqlalchemy.orm import Session
from app.models.quiz import Quiz
from app.schemas.quiz import CreateQuiz, QuizOut
from ..utils.generate_pretest import generate_pretest
from app.models.lesson_content import LessonContent
from app.models.class_material import ClassMaterial
from app.models.student_quiz_progress import StudentQuizProgress
from app.models.users import Users
from app.models.class_enrollment import ClassEnrollment
from app.models.quiz_attempts import StartTime
from app.schemas.quiz_attempts import CreateStartTime
from datetime import datetime

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
        total_points = quiz.total_points,
        instructions = quiz.instructions,
        quiz_content = quiz.quiz_content,
        #start_time = quiz.start_time,
        duration = quiz.duration,
        class_id = quiz.class_id,
        archived = quiz.archived,
        type = quiz.type
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

#display Quiz cards in class
@router.get('/getQuizzes/{classId}', response_model=list[QuizOut])
def get_quizzes(classId: int, db: Session = Depends(get_db)):
    quizzes = db.query(Quiz).filter(Quiz.class_id == classId, Quiz.archived == False).all()

    if not quizzes:
        raise HTTPException(status_code=404, detail="No quizzes found for this class")

    return quizzes

@router.put('/archiveQuiz/{quizId}')
def archiveQuiz(quizId: int, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id ==quizId).first()

    if not quiz:
        raise HTTPException(status_code=400, detail="Quiz not found")
    
    quiz.archived = True
    db.commit()
    db.refresh(quiz)

    return {"message": "Quiz archived Successfully  "}

@router.get('/quizMonitoring/{quizId}')
def quizMonitoring(quizId: int, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quizId).first()

    if not quiz:
        raise HTTPException(status_code = 404, detail="Quiz not found")
    
    lesson = db.query(LessonContent).filter(LessonContent.id == quiz.lesson_id).first()

    if not lesson:
        raise HTTPException(status_code = 404, detail="Lesson not found")
    
    material = db.query(ClassMaterial).filter(ClassMaterial.id == lesson.material_id).first()

    if not material:
        raise HTTPException(status_code = 404, detail="Material not found")

    results = (
        db.query(Users.first_name, Users.last_name, StudentQuizProgress.score)
        .join(StudentQuizProgress, StudentQuizProgress.student_id == Users.id)
        .filter(StudentQuizProgress.quiz_id == quizId).all()
    )

    scores = [
        {"studentName": f"{r.first_name} {r.last_name}", "score" : r.score}
        for r in results
    ]

    return {
        "quizTitle" : quiz.title,
        "lessonTitle" : material.title, 
        "scores" : scores
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

@router.post('/saveStartTime')
def addStartTime(timer: CreateStartTime, db: Session = Depends(get_db)):

    existing = db.query(StartTime).filter(StartTime.quiz_id == timer.quiz_id, StartTime.student_id == timer.student_id).first()

    if existing:
        start_time = existing.start_time

    else:
        save_start_time = StartTime(
            quiz_id = timer.quiz_id,
            student_id = timer.student_id
        )
   
        db.add(save_start_time)
        db.commit()
        db.refresh(save_start_time)

        start_time = save_start_time.start_time

    return {'start_time': start_time}


