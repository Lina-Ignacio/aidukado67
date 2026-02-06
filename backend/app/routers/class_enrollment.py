
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload
from app.models import ClassEnrollment, Users, Classes
from app.schemas.class_enrollment import (EnrollmentCreate, EnrollmentOut, 
    EnrollmentUpdate, EnrollmentClassOut, EnrollmentImportRequest, EnrollmentImportResponse)
from app.database import SessionLocal
from app.database import get_db

router = APIRouter(prefix="/enrollment", tags=["enrollment"])

@router.get("/get", response_model=list[EnrollmentOut])
def get_enrollments(query: str | None = None, db: Session = Depends(get_db)):
    
    enrollments = (
        db.query(ClassEnrollment)
        .options(
            joinedload(ClassEnrollment.student),
            joinedload(ClassEnrollment.enrolled_class)
        )
        .filter(ClassEnrollment.is_archive == False)
    )
    
    if query:
        q = f"%{query}%"
        enrollments = enrollments.join(Users).join(Classes).filter(
            or_(
                Users.first_name.ilike(q),
                Users.last_name.ilike(q),
                Classes.name.ilike(q),
                ClassEnrollment.status.ilike(q)
            )
        )
    
    enrollments = enrollments.order_by(ClassEnrollment.id.asc()).all()
    
    return enrollments

@router.get("/getById/{enrollment_id}", response_model=EnrollmentOut)
def get_enrollment(enrollment_id: int, db: Session = Depends(get_db)):
    enrollment = db.query(ClassEnrollment).filter(ClassEnrollment.id == enrollment_id).first()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment Data not Found")
    
    return enrollment

@router.get("/getByUserId/{user_id}", response_model=list[EnrollmentClassOut])
def get_classes_by_user(user_id: int, db: Session= Depends(get_db)):
    enrollments = (
        db.query(ClassEnrollment)
        .options(
            joinedload(ClassEnrollment.enrolled_class)
            .joinedload(Classes.user_teacher)
        )
        .filter(ClassEnrollment.student_id == user_id)
        .filter(ClassEnrollment.status == "enrolled")
        .filter(ClassEnrollment.is_archive == False)
        .all()
    )
    
    return enrollments



@router.post("/create")
def create_enrollment(new_enrollment: EnrollmentCreate, db: Session = Depends(get_db)):
    
    
    existing_enrollment = db.query(ClassEnrollment).filter(
        ClassEnrollment.class_id == new_enrollment.class_id,
        ClassEnrollment.student_id == new_enrollment.student_id
    ).first()

    if existing_enrollment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student is already enrolled in this class"
        )
    
    # 2. Proceed with creation if not found
    enrollment = ClassEnrollment(
        class_id = new_enrollment.class_id,
        student_id = new_enrollment.student_id,
        status = new_enrollment.status
    )
    
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    
    return {"message": "Enrolled Successfully"}
    
@router.patch("/patch/{enrollment_id}")
def patch_enrollment(enrollment_id: int, enrollment_update: EnrollmentUpdate, db: Session = Depends(get_db)):
    
    enrollment_to_update = db.query(ClassEnrollment).filter(ClassEnrollment.id == enrollment_id).first()
    
    if not enrollment_to_update:
        raise HTTPException(status_code=404, detail="Enrollment Data not Found")
    
    for key, value in enrollment_update.model_dump(exclude_unset=True).items():
        setattr(enrollment_to_update, key, value)
        
    db.commit()
    db.refresh(enrollment_to_update)
    
    
    return {"message" : f"EnrollmentData with id {enrollment_id} has been updated successfully"}

@router.patch("/archive/{enrollment_id}")
def archive_enrollment(enrollment_id: int, db: Session = Depends(get_db)):
    
    enrollment = db.query(ClassEnrollment).filter(ClassEnrollment.id == enrollment_id).first()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment Data not Existing")
    
    if enrollment.status == "enrolled":
        raise HTTPException(
                status_code=400,
                detail="Cannot Archive: student is still currently enrolled."
            )
        
    
    enrollment.is_archive= True
    db.commit()  
    db.refresh(enrollment)
    
    return {"message" : f"Enrollment Data with id: {enrollment_id} has been archived"}


@router.post("/", response_model=EnrollmentImportResponse)
def import_enrollments(
    request: EnrollmentImportRequest, 
    db: Session = Depends(get_db)
):
    """
    Import enrollments from CSV file.
    CSV format: name,email
    Strict validation: ALL emails must exist as students, no duplicates allowed.
    Transaction is rolled back if ANY validation fails.
    """
    try:
        # Read and parse CSV
        csv_data = io.StringIO(request.file_content)
        reader = csv.DictReader(csv_data)
        
        # Validate CSV structure
        required_columns = {"name", "email"}
        if not reader.fieldnames or not required_columns.issubset(set(reader.fieldnames)):
            raise HTTPException(
                status_code=400, 
                detail="CSV must contain 'name' and 'email' columns"
            )
        
        rows = []
        emails = []
        for row_num, row in enumerate(reader, start=2):  # Start at 2 for header row
            if not row.get('email') or not row['email'].strip():
                raise HTTPException(
                    status_code=400, 
                    detail=f"Row {row_num}: Email is required"
                )
            
            email = row['email'].strip().lower()
            rows.append(CSVRow(
                name=row.get('name', '').strip(),
                email=email
            ))
            emails.append(email)
        
        if not rows:
            raise HTTPException(
                status_code=400, 
                detail="CSV file is empty"
            )
        
        # Start transaction
        db.begin()
        
        try:
            # Get the class
            class_obj = db.query(models.Classes).filter(
                models.Classes.id == request.class_id,
                models.Classes.is_archive == False
            ).first()
            
            if not class_obj:
                raise HTTPException(
                    status_code=404, 
                    detail="Class not found or archived"
                )
            
            # Get all users with matching emails (case-insensitive)
            users = db.query(models.Users).filter(
                models.Users.email.in_(emails),
                models.Users.is_archive == False
            ).all()
            
            # Create email->user mapping (lowercase for case-insensitive matching)
            user_dict = {user.email.lower(): user for user in users}
            
            # Validate all emails exist
            failed_emails = []
            for row in rows:
                if row.email not in user_dict:
                    failed_emails.append(row.email)
                    continue
                
                # Check if user is a student
                user = user_dict[row.email]
                if user.role.lower() != "student":
                    failed_emails.append(f"{row.email} (not a student)")
            
            if failed_emails:
                db.rollback()
                return EnrollmentImportResponse(
                    success_count=0,
                    failed_emails=failed_emails,
                    message=f"Import failed: {len(failed_emails)} email(s) not found or not students"
                )
            
            # Check for existing enrollments to avoid duplicates
            existing_enrollments = db.query(models.ClassEnrollment).filter(
                models.ClassEnrollment.class_id == request.class_id,
                models.ClassEnrollment.student_id.in_([user.id for user in users]),
                models.ClassEnrollment.is_archive == False
            ).all()
            
            existing_student_ids = {enrollment.student_id for enrollment in existing_enrollments}
            
            # Create new enrollments
            success_count = 0
            for row in rows:
                user = user_dict[row.email]
                
                # Skip if already enrolled
                if user.id in existing_student_ids:
                    continue
                
                # Create enrollment
                enrollment = models.ClassEnrollment(
                    class_id=request.class_id,
                    student_id=user.id,
                    enrollment_date=date.today(),
                    status="active",
                    is_archive=False
                )
                db.add(enrollment)
                success_count += 1
            
            if success_count == 0:
                db.rollback()
                return EnrollmentImportResponse(
                    success_count=0,
                    failed_emails=[],
                    message="No new enrollments added (all students already enrolled)"
                )
            
            # Commit transaction
            db.commit()
            
            return EnrollmentImportResponse(
                success_count=success_count,
                failed_emails=[],
                message=f"Successfully imported {success_count} enrollment(s)"
            )
            
        except Exception as e:
            db.rollback()
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(
                status_code=500, 
                detail=f"Import failed: {str(e)}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Unexpected error: {str(e)}"
        )