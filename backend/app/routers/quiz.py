from fastapi import APIRouter, Depends, HTTPException, Form, Query
from app.database import SessionLocal
from sqlalchemy.orm import Session
from app.models.quiz import Quiz
from app.schemas.quiz import CreateQuiz, QuizOut, AddStudentsRequest
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
        raise   
    finally:
        db.close()

#get generated quiz
@router.post("/generateQuiz")
async def gen_quiz(lesson: str = Form(...), items: int = Form(...), question_type: str = Form(...)):
    questions = await generate_quiz(lesson, items, question_type)    
    return {"quiz": questions}


# For assigning upon quiz creation
@router.post("/assignQuiz")
def assign_quiz(quiz: CreateQuiz, db: Session = Depends(get_db)):

    new_quiz = Quiz(
        lesson_id=quiz.lesson_id,
        title=quiz.title,
        total_points=quiz.total_points,
        instructions=quiz.instructions,
        quiz_content=quiz.quiz_content,
        duration=quiz.duration,
        class_id=quiz.class_id,
        is_archive=quiz.is_archive,
        assessment_type=quiz.assessment_type,
        term_id=quiz.term_id
    )

    db.add(new_quiz)
    db.commit()
    db.refresh(new_quiz)

    for student_id in quiz.assigned_students:
        db.add(
            StudentQuizProgress(
                quiz_id=new_quiz.id,
                student_id=student_id,
                status="assigned"
            )
        )

    db.commit()

    return {"message": "Quiz created and assigned successfully"}

# For late assigning
@router.post("/assignQuizStudents")
def assign_students_to_quiz(
    payload: AddStudentsRequest,
    db: Session = Depends(get_db)
):
    quiz = db.query(Quiz).filter(Quiz.id == payload.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    existing_students = {
        row.student_id
        for row in db.query(StudentQuizProgress)
        .filter(StudentQuizProgress.quiz_id == payload.quiz_id)
        .all()
    }

    for student_id in payload.student_ids:
        if student_id not in existing_students:
            db.add(
                StudentQuizProgress(
                    quiz_id=payload.quiz_id,
                    student_id=student_id,
                    status="assigned"
                )
            )

    db.commit()
    return {"message": "Students assigned successfully"}

# Getting all assigned students
@router.get("/quiz/{quiz_id}/assigned-students")
def get_assigned_students(quiz_id: int, db: Session = Depends(get_db)):
    assigned = db.query(StudentQuizProgress.student_id).filter(
        StudentQuizProgress.quiz_id == quiz_id
    ).all()

    return [s.student_id for s in assigned]


#get quiz from database
@router.get('/getQuiz/{quizId}', response_model = QuizOut)
def get_quiz(quizId: int, db:Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quizId).first()

    if not quiz:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    return quiz

# For Teachers
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
    
    
# For Students
@router.get("/student/quizzes/{classId}", response_model=list[QuizOut])
def get_student_quizzes(
    classId: int,
    term: int = Query(...),
    studentId: int = Query(...),
    db: Session = Depends(get_db)
):
    quizzes = (
        db.query(Quiz)
        .join(StudentQuizProgress, StudentQuizProgress.quiz_id == Quiz.id)
        .filter(
            Quiz.class_id == classId,
            Quiz.term_id == term,
            Quiz.is_archive == False,
            StudentQuizProgress.student_id == studentId,
        )
        .order_by(desc(Quiz.created_at))
        .all()
    )

    if not quizzes:
        return []  

    return quizzes


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
        db.query(Quiz.title, Quiz.total_points, ClassMaterial.title.label("material_title"))
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
        "totalPoints": header_info.total_points,
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



