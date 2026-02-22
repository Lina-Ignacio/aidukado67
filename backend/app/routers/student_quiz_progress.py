from fastapi import APIRouter, Depends, HTTPException, Query
from app.database import SessionLocal
from sqlalchemy.orm import Session
from app.models.student_quiz_progress import StudentQuizProgress
from app.schemas.student_quiz_progress import CreateScore, ScoreOut, StartTimeRequest, StartTimeResponse
from datetime import datetime, timezone
from app.database import get_db

router = APIRouter()





@router.post("/saveStartTime")
def save_start_time(data: StartTimeRequest, db: Session = Depends(get_db)):
    
    progress = db.query(StudentQuizProgress).filter_by(
        quiz_id=data.quiz_id, 
        student_id=data.student_id
    ).first()

    if not progress:
        raise HTTPException(status_code=404, detail="Assignment not found")

    
    if progress.status == "done":
        return progress
    
    if progress.start_time is None:
        progress.start_time = datetime.now(timezone.utc)
        progress.status = "ongoing"
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