from fastapi import APIRouter, Depends, HTTPException, Query
from app.database import SessionLocal
from sqlalchemy.orm import Session
from app.models.exam.student_exam_progress import StudentExamProgress
from app.models.exam.exams import Exam
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.schemas.exam.student_exam_progress import ExamStartRequest, ExamProgressSave, ExamSubmission
from app.database import get_db
import json


router = APIRouter()





@router.post("/exams/start")
def start_exam(data: ExamStartRequest, db: Session = Depends(get_db)):
    """
    Start or continue an exam for a student
    """
    
    progress = db.query(StudentExamProgress).filter_by(
        exam_id=data.exam_id, 
        student_id=data.student_id
    ).first()

    if not progress:
        raise HTTPException(status_code=404, detail="Exam assignment not found")

    if progress.status == "submitted":
        return progress
    
    if progress.start_time is None:
        progress.start_time = datetime.now(timezone.utc)
        progress.status = "in_progress"
        db.commit()
        db.refresh(progress)

    return progress

@router.post('/exam/student/submit-exam')
def submit_exam(exam_data: ExamSubmission, db: Session = Depends(get_db)):
    """
    Submit exam results
    """
    progress = db.query(StudentExamProgress).filter(
        StudentExamProgress.student_id == exam_data.student_id,
        StudentExamProgress.exam_id == exam_data.exam_id
    ).first()

    if not progress:
        progress = StudentExamProgress(
            student_id=exam_data.student_id,
            exam_id=exam_data.exam_id,
            status="assigned"
        )
        db.add(progress)
    
    progress.status = "submitted"
    progress.score = exam_data.score
    
    # Ensure answers are stored as JSON
    
    progress.answers = json.dumps(exam_data.answers) if isinstance(exam_data.answers, dict) else exam_data.answers
   
    db.commit()
    db.refresh(progress)
    
    # Parse answers back if needed for response
    if isinstance(progress.answers, str):
        try:
            progress.answers = json.loads(progress.answers)
        except:
            pass
            
    return {"message": "Exam submitted successfully", "score": progress.score}

@router.get("/exam/student/results/{examId}/{studentId}")
def get_exam_results(examId: int, studentId: int, db: Session = Depends(get_db)):
    """
    Get exam results for a student
    """
    progress = db.query(StudentExamProgress).filter(
        StudentExamProgress.student_id == studentId,
        StudentExamProgress.exam_id == examId
    ).first()

    if not progress or progress.status != "submitted":
        return {
            "answers": {},
            "score": None,
            "submitted": False,
            "start_time": None,
            
        }

    exam = db.query(Exam).filter(Exam.id == examId).first()
    
    result = {
        "answers": progress.answers or {},
        "score": progress.score,
        "submitted": progress.status == "submitted",
        "start_time": progress.start_time,
        
    }
    
    if exam:
        result.update({
            "passing_score": exam.passing_score,
            "total_points": exam.total_points,
            "is_passing": progress.score >= exam.passing_score if exam.passing_score and progress.score is not None else None
        })
    
    return result

@router.post('/exam/student/save-progress')
def save_exam_progress(progress_data: ExamProgressSave, db: Session = Depends(get_db)):
    """
    Save exam progress during attempt (autosave)
    """
    progress = db.query(StudentExamProgress).filter(
        StudentExamProgress.student_id == progress_data.student_id,
        StudentExamProgress.exam_id == progress_data.exam_id
    ).first()

    if not progress:
        raise HTTPException(status_code=404, detail="Exam progress not found")

    if progress.status == "in_progress":
        progress.answers = progress_data.answers
       
        db.commit()
        return {"message": "Progress saved successfully"}
    
    return {"message": "Exam already submitted, progress not saved"}

@router.get("/exam/student/{examId}/{studentId}")
def get_exam_with_progress(examId: int, studentId: int, db: Session = Depends(get_db)):
    """
    Get exam details along with student progress
    """
    exam = db.query(Exam).filter(Exam.id == examId).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    progress = db.query(StudentExamProgress).filter(
        StudentExamProgress.student_id == studentId,
        StudentExamProgress.exam_id == examId
    ).first()

    exam_data = {
        "id": exam.id,
        "title": exam.title,
        "instructions": exam.instructions,
        "duration": exam.duration,
        "total_points": exam.total_points,
        "passing_score": exam.passing_score,
        "shuffle_questions": exam.shuffle_questions,
        "exam_content": exam.exam_content,  
        "created_at": exam.created_at
    }

    if progress:
        return {
            "exam": exam_data,
            "progress": {
                "status": progress.status,
                "score": progress.score,
                "answers": progress.answers,
                "start_time": progress.start_time,
               
            }
        }
    else:
        return {
            "exam": exam_data,
            "progress": None
        }