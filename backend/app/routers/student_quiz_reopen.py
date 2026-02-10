# app/routes/quiz/quiz_reopen.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta, timezone
from app.database import get_db
from app.models import Users, ClassEnrollment, Quiz
from app.models import StudentQuizProgress, StudentQuizReopen
from app.schemas.student_quiz_reopen import QuizEligibleStudentResponse, QuizReopenRequest, QuizReopenResponse

router = APIRouter(prefix="/quiz_reopen", tags=["Quiz Reopen"])

@router.get("/{quiz_id}/reopen-eligible", response_model=List[QuizEligibleStudentResponse])
def get_quiz_reopen_eligible_students(
    quiz_id: int,
    db: Session = Depends(get_db)
):
    """
    Get students eligible for quiz reopening
    Eligibility criteria:
    1. Quiz is past closing_time
    2. No submission (no StudentQuizProgress record with score) OR submission was after closing_time
    3. Don't have an active StudentQuizReopen record
    4. Are enrolled in the class
    """
    
    # Verify quiz exists
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Check if quiz has a closing_time
    if not quiz.closing_time:
        raise HTTPException(
            status_code=400, 
            detail="This quiz doesn't have a closing time"
        )
    
    # Get current time
    now = datetime.now(timezone.utc)
    closing_time = quiz.closing_time
    
    # Ensure closing_time is timezone aware
    if closing_time.tzinfo is None:
        closing_time = closing_time.replace(tzinfo=timezone.utc)
    
    # Check if closing time has passed
    if now <= closing_time:
        raise HTTPException(
            status_code=400, 
            detail="Quiz is not past due yet. Cannot reopen until after closing time."
        )
    
    # Get all students enrolled in the class
    enrolled_students = (
        db.query(Users.id, Users.first_name, Users.last_name)
        .join(ClassEnrollment, ClassEnrollment.student_id == Users.id)
        .filter(ClassEnrollment.class_id == quiz.class_id)
        .all()
    )
    
    eligible_students = []
    
    for student in enrolled_students:
        # Check if student has quiz progress (submission)
        progress = (
            db.query(StudentQuizProgress)
            .filter(
                StudentQuizProgress.quiz_id == quiz_id,
                StudentQuizProgress.student_id == student.id
            )
            .first()
        )
        
        # Check for active reopen record
        active_reopen = (
            db.query(StudentQuizReopen)
            .filter(
                StudentQuizReopen.quiz_id == quiz_id,
                StudentQuizReopen.student_id == student.id,
                StudentQuizReopen.new_closing_time > now  # Active reopen
            )
            .first()
        )
        
        # Student has submission if they have a score
        has_submission = progress is not None and progress.score is not None
        submission_was_late = False
        
        if has_submission and progress.start_time:
            # Check if submission was after closing time
            start_time = progress.start_time
            if start_time.tzinfo is None:
                start_time = start_time.replace(tzinfo=timezone.utc)
            submission_was_late = start_time > closing_time
        
        has_active_reopen = active_reopen is not None
        
        # Eligible if: (no submission OR late submission) AND no active reopen
        if (not has_submission or submission_was_late) and not has_active_reopen:
            status = "no_submission" if not has_submission else "late_submission"
            eligible_students.append({
                "id": student.id,
                "first_name": student.first_name,
                "last_name": student.last_name,
                "full_name": f"{student.first_name} {student.last_name}",
                "status": status,
                "submission_status": "No submission" if not has_submission else "Late submission"
            })
    
    return eligible_students


@router.post("/{quiz_id}/reopen", response_model=QuizReopenResponse)
def reopen_quiz_for_students(
    quiz_id: int,
    request: QuizReopenRequest,
    db: Session = Depends(get_db)
):
    """
    Reopen quiz for selected students with new closing time
    """
    
    # Validate quiz exists
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Check if quiz has a closing_time
    if not quiz.closing_time:
        raise HTTPException(
            status_code=400, 
            detail="This quiz doesn't have a closing time"
        )
    
    # Get current time
    now = datetime.now(timezone.utc)
    closing_time = quiz.closing_time
    
    # Ensure closing_time is timezone aware
    if closing_time.tzinfo is None:
        closing_time = closing_time.replace(tzinfo=timezone.utc)
    
    # Check if closing time has passed
    if now <= closing_time:
        raise HTTPException(
            status_code=400, 
            detail="Quiz is not past due yet. Cannot reopen until after closing time."
        )
    
    # Ensure new_closing_time is timezone aware
    new_closing_time = request.new_closing_time
    if new_closing_time.tzinfo is None:
        new_closing_time = new_closing_time.replace(tzinfo=timezone.utc)
    
    # Validate new closing time
    min_allowed_time = now + timedelta(minutes=30)  # Minimum 30 minutes from now
    
    if new_closing_time <= min_allowed_time:
        raise HTTPException(
            status_code=400,
            detail=f"New closing time must be at least 30 minutes from now. Minimum: {min_allowed_time.isoformat()}"
        )
    
    # Check if any students already have active reopenings
    existing_reopens = (
        db.query(StudentQuizReopen.student_id)
        .filter(
            StudentQuizReopen.quiz_id == quiz_id,
            StudentQuizReopen.student_id.in_(request.student_ids),
            StudentQuizReopen.new_closing_time > now  # Active records
        )
        .all()
    )
    existing_student_ids = {student_id for (student_id,) in existing_reopens}
    
    if existing_student_ids:
        raise HTTPException(
            status_code=400,
            detail=f"Some students already have active reopenings: {list(existing_student_ids)}"
        )
    
    # Verify all students are enrolled in the class
    enrolled_student_ids = (
        db.query(ClassEnrollment.student_id)
        .filter(ClassEnrollment.class_id == quiz.class_id)
        .all()
    )
    enrolled_student_ids = {student_id for (student_id,) in enrolled_student_ids}
    
    invalid_students = [sid for sid in request.student_ids if sid not in enrolled_student_ids]
    
    if invalid_students:
        raise HTTPException(
            status_code=400,
            detail=f"Some students are not enrolled in this class: {invalid_students}"
        )
    
    # Create StudentQuizReopen records
    created_count = 0
    errors = []
    
    for student_id in request.student_ids:
        try:
            # Check eligibility one more time
            progress = (
                db.query(StudentQuizProgress)
                .filter(
                    StudentQuizProgress.quiz_id == quiz_id,
                    StudentQuizProgress.student_id == student_id
                )
                .first()
            )
            
            # Student has submission if they have a score
            has_submission = progress is not None and progress.score is not None
            submission_was_late = False
            
            if has_submission and progress.start_time:
                # Check if submission was after closing time
                start_time = progress.start_time
                if start_time.tzinfo is None:
                    start_time = start_time.replace(tzinfo=timezone.utc)
                submission_was_late = start_time > closing_time
            
            # Only create reopen if: no submission OR late submission
            if not has_submission or submission_was_late:
                reopen_record = StudentQuizReopen(
                    quiz_id=quiz_id,
                    student_id=student_id,
                    new_closing_time=new_closing_time,
                    reason=request.reason,
                    created_at=now
                )
                db.add(reopen_record)
                created_count += 1
        
        except Exception as e:
            errors.append(f"Student {student_id}: {str(e)}")
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save reopen records: {str(e)}"
        )
    
    return QuizReopenResponse(
        message=f"Quiz reopened for {created_count} student(s)",
        created_count=created_count,
        new_closing_time=new_closing_time.isoformat(),
        reason=request.reason
    )


@router.get("/student/{quiz_id}/{student_id}")
def get_student_quiz_reopen_info(
    quiz_id: int,
    student_id: int,
    db: Session = Depends(get_db)
):
    """
    Get reopen information for a specific student and quiz
    """
    reopen_record = (
        db.query(StudentQuizReopen)
        .filter(
            StudentQuizReopen.quiz_id == quiz_id,
            StudentQuizReopen.student_id == student_id
        )
        .order_by(StudentQuizReopen.new_closing_time.desc())
        .first()
    )
    
    if not reopen_record:
        raise HTTPException(status_code=404, detail="No reopen record found")
    
    return {
        "id": reopen_record.id,
        "new_closing_time": reopen_record.new_closing_time,
        "reason": reopen_record.reason,
        "created_at": reopen_record.created_at
    }
    

@router.get("/student/{quiz_id}/{student_id}")
def get_student_quiz_reopen_info(
    quiz_id: int,
    student_id: int,
    db: Session = Depends(get_db)
):
    """
    Get reopen information for a specific student and quiz
    """
    reopen_record = (
        db.query(StudentQuizReopen)
        .filter(
            StudentQuizReopen.quiz_id == quiz_id,
            StudentQuizReopen.student_id == student_id
        )
        .order_by(StudentQuizReopen.new_closing_time.desc())
        .first()
    )
    
    if not reopen_record:
        raise HTTPException(status_code=404, detail="No reopen record found")
    
    return {
        "id": reopen_record.id,
        "new_closing_time": reopen_record.new_closing_time,
        "reason": reopen_record.reason,
        "created_at": reopen_record.created_at
    }