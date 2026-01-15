from fastapi import APIRouter, Depends, HTTPException, Query
from app.database import SessionLocal
from sqlalchemy.orm import Session
from app.models.student_quiz_progress import StudentQuizProgress
from app.schemas.student_quiz_progress import CreateScore, ScoreOut, StartTimeRequest, StartTimeResponse
from datetime import datetime, timezone

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post('/saveStartTime', response_model=StartTimeResponse)
def save_start_time(req: StartTimeRequest, db: Session = Depends(get_db)):
    
    progress = db.query(StudentQuizProgress).filter(
        StudentQuizProgress.student_id == req.student_id,
        StudentQuizProgress.quiz_id == req.quiz_id
    ).first()

    if not progress:
        
        progress = StudentQuizProgress(
            student_id=req.student_id,
            quiz_id=req.quiz_id,
            status="ongoing",
            start_time=datetime.now(timezone.utc),
            score=0,
            answers={}
        )
        db.add(progress)
        db.commit()
        db.refresh(progress)

    return progress


@router.post('/saveScore')
def save_score(score: CreateScore, db: Session = Depends(get_db)):
 
    progress = db.query(StudentQuizProgress).filter(
        StudentQuizProgress.student_id == score.student_id,
        StudentQuizProgress.quiz_id == score.quiz_id
    ).first()

    if not progress:
       
        progress = StudentQuizProgress(
            student_id=score.student_id,
            quiz_id=score.quiz_id
        )
        db.add(progress)

    
    progress.status = "done"
    progress.score = score.score
    progress.answers = score.answers
    
    db.commit()
    return {"message": "Score updated successfully"}


@router.get("/getUserAnswers/{quizId}/{studentId}")
def get_quiz_with_answers(quizId: int, studentId: int, db: Session = Depends(get_db)):
    progress = db.query(StudentQuizProgress).filter(
        StudentQuizProgress.student_id == studentId,
        StudentQuizProgress.quiz_id == quizId
    ).first()

    if not progress:
        return {
            "answers": {},
            "score": None,
            "taken": False,
            "start_time": None
        }

    return {
        "answers": progress.answers,
        "score": progress.score,
        "taken": progress.status == "done",
        "start_time": progress.start_time
    }