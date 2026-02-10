from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta, timezone
from app.database import get_db
from app.models import ClassMaterial, Users, StudentSubmission, ClassEnrollment
from app.models.submission.student_task_reopens import StudentTaskReopen
from app.schemas.student_task_reopen import EligibleStudentResponse, ReopenTaskRequest, ReopenTaskResponse

router = APIRouter(prefix="/task_reopen", tags=["Task Reopen"])

@router.get("/{material_id}/reopen-eligible", response_model=List[EligibleStudentResponse])
def get_reopen_eligible_students(
    material_id: int,
    db: Session = Depends(get_db)
):
    """
    Get students eligible for task reopening
    Eligibility criteria:
    1. Past due date
    2. No submission OR submission was after due date
    3. Don't have an active StudentTaskReopen record
    4. Are enrolled in the class
    """
    
    # Verify material exists
    material = db.query(ClassMaterial).filter(ClassMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check if task has a due date
    if not material.due_date:
        raise HTTPException(
            status_code=400, 
            detail="This task doesn't have a due date"
        )
    
    # Get current time (naive UTC)
    now = datetime.utcnow()
    due_date = material.due_date
    
    # Remove timezone info from due_date if it has any (convert to naive UTC)
    if due_date.tzinfo is not None:
        due_date = due_date.replace(tzinfo=None)
    
    # Check if due date has passed (compare naive datetimes in UTC)
    if now <= due_date:
        raise HTTPException(
            status_code=400, 
            detail="Task is not past due yet. Cannot reopen until after due date."
        )
    
    # Get all students enrolled in the class
    enrolled_students = (
        db.query(Users.id, Users.first_name, Users.last_name)
        .join(ClassEnrollment, ClassEnrollment.student_id == Users.id)
        .filter(ClassEnrollment.class_id == material.class_id)
        .all()
    )
    
    eligible_students = []
    
    for student in enrolled_students:
        # Check if student has a submission
        submission = (
            db.query(StudentSubmission)
            .filter(
                StudentSubmission.material_id == material_id,
                StudentSubmission.student_id == student.id,
                StudentSubmission.file_path.isnot(None)  # Has a submission
            )
            .first()
        )
        
        # Check for active reopen record
        active_reopen = (
            db.query(StudentTaskReopen)
            .filter(
                StudentTaskReopen.material_id == material_id,
                StudentTaskReopen.student_id == student.id,
                StudentTaskReopen.new_due_date > now  # Active reopen
            )
            .first()
        )
        
        # Student is eligible if:
        # 1. No submission OR submission was late (after due date)
        # 2. No active reopen record
        # 3. Past due date (already checked above)
        
        has_submission = submission is not None
        submission_was_late = False
        
        if has_submission and submission.submitted_at:
            # Remove timezone from submitted_at if present
            submitted_at = submission.submitted_at
            if submitted_at.tzinfo is not None:
                submitted_at = submitted_at.replace(tzinfo=None)
            submission_was_late = submitted_at > due_date
        
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


@router.post("/{material_id}/reopen", response_model=ReopenTaskResponse)
def reopen_task_for_students(
    material_id: int,
    request: ReopenTaskRequest,
    db: Session = Depends(get_db)
):
    """
    Reopen task for selected students with new due date
    """
    
    # Validate material exists
    material = db.query(ClassMaterial).filter(ClassMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check if task has a due date
    if not material.due_date:
        raise HTTPException(
            status_code=400, 
            detail="This task doesn't have a due date"
        )
    
    # Get current time (naive UTC)
    now = datetime.utcnow()
    due_date = material.due_date
    
    # Remove timezone info from due_date if it has any
    if due_date.tzinfo is not None:
        due_date = due_date.replace(tzinfo=None)
    
    # Check if due date has passed
    if now <= due_date:
        raise HTTPException(
            status_code=400, 
            detail="Task is not past due yet. Cannot reopen until after due date."
        )
    
    # Convert request.new_due_date to naive UTC if needed
    new_due_date = request.new_due_date
    if new_due_date.tzinfo is not None:
        new_due_date = new_due_date.replace(tzinfo=None)
    
    # Validate new due date
    min_allowed_time = now + timedelta(minutes=30)  # Minimum 30 minutes from now
    
    if new_due_date <= min_allowed_time:
        raise HTTPException(
            status_code=400,
            detail=f"New due date must be at least 30 minutes from now. Minimum: {min_allowed_time.isoformat()}"
        )
    
    # Check if any students already have active reopenings
    existing_reopens = (
        db.query(StudentTaskReopen.student_id)
        .filter(
            StudentTaskReopen.material_id == material_id,
            StudentTaskReopen.student_id.in_(request.student_ids),
            StudentTaskReopen.new_due_date > now  # Active records
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
        .filter(ClassEnrollment.class_id == material.class_id)
        .all()
    )
    enrolled_student_ids = {student_id for (student_id,) in enrolled_student_ids}
    
    invalid_students = [sid for sid in request.student_ids if sid not in enrolled_student_ids]
    
    if invalid_students:
        raise HTTPException(
            status_code=400,
            detail=f"Some students are not enrolled in this class: {invalid_students}"
        )
    
    # Create StudentTaskReopen records
    created_count = 0
    errors = []
    
    for student_id in request.student_ids:
        try:
            # Check eligibility one more time
            submission = (
                db.query(StudentSubmission)
                .filter(
                    StudentSubmission.material_id == material_id,
                    StudentSubmission.student_id == student_id,
                    StudentSubmission.file_path.isnot(None)
                )
                .first()
            )
            
            has_submission = submission is not None
            submission_was_late = False
            
            if has_submission and submission.submitted_at:
                # Remove timezone from submitted_at if present
                submitted_at = submission.submitted_at
                if submitted_at.tzinfo is not None:
                    submitted_at = submitted_at.replace(tzinfo=None)
                submission_was_late = submitted_at > due_date
            
            # Only create reopen if: no submission OR late submission
            if not has_submission or submission_was_late:
                reopen_record = StudentTaskReopen(
                    material_id=material_id,
                    student_id=student_id,
                    new_due_date=new_due_date,  # Use the converted date
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
    
    return ReopenTaskResponse(
        message=f"Task reopened for {created_count} student(s)",
        created_count=created_count,
        new_due_date=new_due_date.isoformat(),
        reason=request.reason
    )
    
@router.get("/student/{material_id}/{student_id}")
def get_student_reopen_info(
    material_id: int,
    student_id: int,
    db: Session = Depends(get_db)
):
    """
    Get reopen information for a specific student and material
    """
    reopen_record = (
        db.query(StudentTaskReopen)
        .filter(
            StudentTaskReopen.material_id == material_id,
            StudentTaskReopen.student_id == student_id
        )
        .order_by(StudentTaskReopen.new_due_date.desc())
        .first()
    )
    
    if not reopen_record:
        raise HTTPException(status_code=404, detail="No reopen record found")
    
    return {
        "id": reopen_record.id,
        "new_due_date": reopen_record.new_due_date,
        "reason": reopen_record.reason,
        "created_at": reopen_record.created_at
    }