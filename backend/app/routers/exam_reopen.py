# app/routers/exam_reopen.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta, timezone
from app.database import get_db
from app.models import Exam, Users, StudentExamProgress, StudentExamReopen
from app.schemas.exam.exam_reopen import EligibleStudentResponse, ReopenExamRequest, ReopenExamResponse
from app.utils.auth import get_current_user

router = APIRouter(prefix="/exam_reopen", tags=["Exam Reopen"])

@router.get("/{exam_id}/reopen-eligible", response_model=List[EligibleStudentResponse])
def get_reopen_eligible_students(
    exam_id: int,
    db: Session = Depends(get_db)
):
    """
    Get students eligible for exam reopening
    Only returns students who:
    1. Have status="assigned" in StudentExamProgress
    2. Don't have an active StudentExamReopen record
    3. Are in the same class as the exam
    """
    
    # Verify exam exists and teacher has access
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Get current time for comparison
    now = datetime.now(timezone.utc)
    
    # Check if exam closing time has passed
    if now <= exam.closing_time:
        raise HTTPException(
            status_code=400, 
            detail="Exam is still active. Cannot reopen until after closing time."
        )
    
    # Query eligible students
    eligible_students = (
        db.query(
            Users.id,
            Users.first_name,
            Users.last_name,
            StudentExamProgress.status
        )
        .join(StudentExamProgress, StudentExamProgress.student_id == Users.id)
        .outerjoin(
            StudentExamReopen,
            (StudentExamReopen.exam_id == exam_id) & 
            (StudentExamReopen.student_id == Users.id) &
            (StudentExamReopen.new_closing_time > now)  # Active reopen records
        )
        .filter(
            StudentExamProgress.exam_id == exam_id,
            StudentExamProgress.status == "assigned",  # Only "assigned" students
            StudentExamReopen.id.is_(None)  # No active reopen records
        )
        .order_by(Users.last_name, Users.first_name)
        .all()
    )
    
    # Format response
    return [
        {
            "id": student.id,
            "first_name": student.first_name,
            "last_name": student.last_name,
            "full_name": f"{student.first_name} {student.last_name}",
            "status": student.status
        }
        for student in eligible_students
    ]
    


@router.post("/{exam_id}/reopen")
def reopen_exam_for_students(
    exam_id: int,
    request: ReopenExamRequest,
    db: Session = Depends(get_db)
):
    """
    Reopen exam for selected students with new closing time
    """
    
    # Validate exam exists
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Check if exam allows reopening
    
    now = datetime.now(timezone.utc)  # ✅ This is timezone-aware UTC
    
    # Validate new closing time
    min_allowed_time = now + timedelta(hours=1)
    
    
    if request.new_closing_time <= min_allowed_time:
        raise HTTPException(
            status_code=400,
            detail=f"New closing time must be at least 1 hour from now. Minimum: {min_allowed_time.isoformat()}"
        )
    
    # Check if any students are already reopened
    existing_reopens = (
        db.query(StudentExamReopen.student_id)
        .filter(
            StudentExamReopen.exam_id == exam_id,
            StudentExamReopen.student_id.in_(request.student_ids),
            StudentExamReopen.new_closing_time > now  # Active records
        )
        .all()
    )
    existing_student_ids = {student_id for (student_id,) in existing_reopens}
    
    if existing_student_ids:
        raise HTTPException(
            status_code=400,
            detail=f"Some students already have active reopenings: {list(existing_student_ids)}"
        )
    
    # Verify all students have status="assigned"
    invalid_students = []
    for student_id in request.student_ids:
        progress = (
            db.query(StudentExamProgress)
            .filter(
                StudentExamProgress.exam_id == exam_id,
                StudentExamProgress.student_id == student_id,
                StudentExamProgress.status == "assigned"
            )
            .first()
        )
        if not progress:
            invalid_students.append(student_id)
    
    if invalid_students:
        raise HTTPException(
            status_code=400,
            detail=f"Some students are not eligible (must have status='assigned'): {invalid_students}"
        )
    
    # Create StudentExamReopen records
    created_count = 0
    skipped_count = 0
    errors = []
    
    for student_id in request.student_ids:
        try:
            # Create new reopen record
            reopen_record = StudentExamReopen(
                exam_id=exam_id,
                student_id=student_id,
                new_closing_time=request.new_closing_time, 
                created_at=now
            )
            db.add(reopen_record)
            created_count += 1
            
        except Exception as e:
            errors.append(f"Student {student_id}: {str(e)}")
            skipped_count += 1
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save reopen records: {str(e)}"
        )
    
    return {
        "message": f"Exam reopened for {created_count} student(s)",
        "created_count": created_count,
        "skipped_count": skipped_count,
        "errors": errors if errors else None,
        "new_closing_time": request.new_closing_time.isoformat()  
    }