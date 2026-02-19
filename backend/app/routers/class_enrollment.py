from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload
from app.models import ClassEnrollment, Users, Classes
from app.schemas.class_enrollment import (EnrollmentCreate, EnrollmentOut, 
    EnrollmentUpdate, EnrollmentClassOut, EnrollmentImportRequest, EnrollmentImportResponse, CSVRow, EnrollmentTableOut)
from app.database import SessionLocal
from app.database import get_db
from app.utils.decryption import safe_decrypt_data, safe_decrypt_teacher
import io
import csv
from datetime import date

router = APIRouter(prefix="/enrollment", tags=["enrollment"])

@router.get("/getByUserId/{user_id}", response_model=list[EnrollmentClassOut])
def get_classes_by_user(user_id: int, db: Session = Depends(get_db)):
    """
    Get all classes for a specific user with safely decrypted teacher names.
    """
    # Query enrollments
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
    
    # Convert to response model with safe decryption
    result = []
    for enrollment in enrollments:
        # Base enrollment dict
        enrollment_dict = {
            "id": enrollment.id,
            "class_id": enrollment.class_id,
            "student_id": enrollment.student_id,
            "enrollment_date": enrollment.enrollment_date,
            "status": enrollment.status,
            "is_archive": enrollment.is_archive,
        }
        
        # Handle the enrolled class with ONLY fields that exist in your model
        if enrollment.enrolled_class:
            class_obj = enrollment.enrolled_class
            class_dict = {
                "id": class_obj.id,
                "subject_id": class_obj.subject_id,
                "teacher_id": class_obj.teacher_id,
                "name": class_obj.name,
                "is_archive": class_obj.is_archive,
                "schedule": class_obj.schedule,
                "room": class_obj.room,
                "section": class_obj.section,
                "academic_year": class_obj.academic_year,
                "semester": class_obj.semester,
                "lecture_units": class_obj.lecture_units,
                "lab_units": class_obj.lab_units,
            }
            
            # Handle the teacher with safe decryption
            if class_obj.user_teacher:
                teacher = class_obj.user_teacher
                class_dict["user_teacher"] = {
                    "id": teacher.id,
                    "email": teacher.email,
                    "first_name": safe_decrypt_data(teacher.first_name),
                    "last_name": safe_decrypt_data(teacher.last_name),
                    "middle_name": safe_decrypt_data(teacher.middle_name),
                    "role": teacher.role,
                    "is_archive": teacher.is_archive,
                    "must_change_password": teacher.must_change_password,
                    "created_at": teacher.created_at,
                }
            else:
                class_dict["user_teacher"] = None
            
            enrollment_dict["enrolled_class"] = class_dict
        else:
            enrollment_dict["enrolled_class"] = None
        
        result.append(enrollment_dict)
    
    return result


@router.get("/get", response_model=list[EnrollmentTableOut])
def get_enrollments(db: Session = Depends(get_db)):
    """
    Get all enrollments with safely decrypted student names.
    """
    enrollments = (
        db.query(
            ClassEnrollment.id,
            ClassEnrollment.class_id,
            ClassEnrollment.student_id,
            ClassEnrollment.enrollment_date,
            ClassEnrollment.status,
            Users.first_name.label('student_first_name'),
            Users.last_name.label('student_last_name'),
            Classes.name.label('class_name')
        )
        .join(Users, ClassEnrollment.student_id == Users.id)
        .join(Classes, ClassEnrollment.class_id == Classes.id)
        .filter(ClassEnrollment.is_archive == False)
        .filter(Users.is_archive == False)  
        .filter(Classes.is_archive == False)  
        .order_by(ClassEnrollment.enrollment_date.desc())
        .all()
    )
    
    # Safely decrypt student names
    result = []
    for enrollment in enrollments:
        enrollment_dict = enrollment._asdict()
        
        # Use safe decryption
        enrollment_dict['student_first_name'] = safe_decrypt_data(enrollment_dict.get('student_first_name'))
        enrollment_dict['student_last_name'] = safe_decrypt_data(enrollment_dict.get('student_last_name'))
        
        result.append(enrollment_dict)
    
    return result


@router.get("/get-filtered", response_model=list[EnrollmentTableOut])
def get_enrollments_filtered(
    query: str | None = None, 
    db: Session = Depends(get_db)
):
    """
    Get filtered enrollments with safely decrypted student names.
    Filters only by class name and status (fields that aren't encrypted).
    """
    q = (
        db.query(
            ClassEnrollment.id,
            ClassEnrollment.class_id,
            ClassEnrollment.student_id,
            ClassEnrollment.enrollment_date,
            ClassEnrollment.status,
            Users.first_name.label('student_first_name'),
            Users.last_name.label('student_last_name'),
            Classes.name.label('class_name')
        )
        .join(Users, ClassEnrollment.student_id == Users.id)
        .join(Classes, ClassEnrollment.class_id == Classes.id)
        .filter(ClassEnrollment.is_archive == False)
        .filter(Users.is_archive == False)
        .filter(Classes.is_archive == False)
    )
    
    
    if query and query.strip():
        search = f"%{query.strip()}%"
        q = q.filter(
            or_(
                Classes.name.ilike(search),      
                ClassEnrollment.status.ilike(search)  
            )
        )
    
    enrollments = q.order_by(ClassEnrollment.enrollment_date.desc()).all()
    
    # Safely decrypt student names
    result = []
    for enrollment in enrollments:
        enrollment_dict = enrollment._asdict()
        
        enrollment_dict['student_first_name'] = safe_decrypt_data(enrollment_dict.get('student_first_name'))
        enrollment_dict['student_last_name'] = safe_decrypt_data(enrollment_dict.get('student_last_name'))
        
        result.append(enrollment_dict)
    
    return result


@router.get("/getById/{enrollment_id}", response_model=EnrollmentOut)
def get_enrollment(enrollment_id: int, db: Session = Depends(get_db)):
    enrollment = db.query(ClassEnrollment).filter(ClassEnrollment.id == enrollment_id).first()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment Data not Found")
    
    # Create a response dict with safely decrypted student names
    if enrollment.student:
        enrollment.student.first_name = safe_decrypt_data(enrollment.student.first_name)
        enrollment.student.last_name = safe_decrypt_data(enrollment.student.last_name)
    
    return enrollment


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
    
    enrollment = ClassEnrollment(
        class_id=new_enrollment.class_id,
        student_id=new_enrollment.student_id,
        status=new_enrollment.status
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
    
    return {"message": f"EnrollmentData with id {enrollment_id} has been updated successfully"}


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
    
    enrollment.is_archive = True
    db.commit()  
    db.refresh(enrollment)
    
    return {"message": f"Enrollment Data with id: {enrollment_id} has been archived"}


@router.post("/import", response_model=EnrollmentImportResponse)
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
        for row_num, row in enumerate(reader, start=2):
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
            class_obj = db.query(Classes).filter(
                Classes.id == request.class_id,
                Classes.is_archive == False
            ).first()
            
            if not class_obj:
                raise HTTPException(
                    status_code=404, 
                    detail="Class not found or archived"
                )
            
            # Get all users with matching emails (case-insensitive)
            users = db.query(Users).filter(
                Users.email.in_(emails),
                Users.is_archive == False
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
            existing_enrollments = db.query(ClassEnrollment).filter(
                ClassEnrollment.class_id == request.class_id,
                ClassEnrollment.student_id.in_([user.id for user in users]),
                ClassEnrollment.is_archive == False
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
                enrollment = ClassEnrollment(
                    class_id=request.class_id,
                    student_id=user.id,
                    enrollment_date=date.today(),
                    status="enrolled",
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
        
        
@router.get("/debug/check-user-enrollments/{user_id}")
def debug_user_enrollments(user_id: int, db: Session = Depends(get_db)):
    """
    Debug route to check the exact enrollment path for a specific user
    """
    from app.utils.auth import decrypt_data
    
    # Get enrollments for the user
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
    
    results = []
    
    for enrollment in enrollments:
        enrollment_data = {
            "enrollment_id": enrollment.id,
            "class_id": enrollment.class_id,
            "student_id": enrollment.student_id,
            "class_name": enrollment.enrolled_class.name if enrollment.enrolled_class else None,
        }
        
        # Check teacher data
        if enrollment.enrolled_class and enrollment.enrolled_class.user_teacher:
            teacher = enrollment.enrolled_class.user_teacher
            teacher_data = {
                "teacher_id": teacher.id,
                "teacher_email": teacher.email,
                "first_name_raw_preview": str(teacher.first_name)[:50] + "..." if teacher.first_name else None,
                "last_name_raw_preview": str(teacher.last_name)[:50] + "..." if teacher.last_name else None,
            }
            
            # Test decryption
            try:
                if teacher.first_name:
                    decrypted_first = decrypt_data(teacher.first_name)
                    teacher_data["first_name_decrypted"] = decrypted_first
                    teacher_data["first_name_decrypt_success"] = True
            except Exception as e:
                teacher_data["first_name_decrypt_success"] = False
                teacher_data["first_name_error"] = str(e)
            
            try:
                if teacher.last_name:
                    decrypted_last = decrypt_data(teacher.last_name)
                    teacher_data["last_name_decrypted"] = decrypted_last
                    teacher_data["last_name_decrypt_success"] = True
            except Exception as e:
                teacher_data["last_name_decrypt_success"] = False
                teacher_data["last_name_error"] = str(e)
            
            enrollment_data["teacher"] = teacher_data
        else:
            enrollment_data["teacher"] = None
        
        results.append(enrollment_data)
    
    return {
        "user_id": user_id,
        "enrollment_count": len(enrollments),
        "enrollments": results
    }
    
@router.get("/debug/force-check-user-1")
def force_check_user_1(db: Session = Depends(get_db)):
    """
    Force a fresh query for user 1 with detailed logging
    """
    from app.utils.auth import decrypt_data
    import traceback
    
    results = {
        "user_id": 1,
        "steps": [],
        "error": None,
        "teachers_checked": []
    }
    
    try:
        # Step 1: Query the database
        results["steps"].append("Querying database...")
        enrollments = (
            db.query(ClassEnrollment)
            .options(
                joinedload(ClassEnrollment.enrolled_class)
                .joinedload(Classes.user_teacher)
            )
            .filter(ClassEnrollment.student_id == 1)
            .filter(ClassEnrollment.status == "enrolled")
            .filter(ClassEnrollment.is_archive == False)
            .all()
        )
        
        results["steps"].append(f"Found {len(enrollments)} enrollments")
        
        # Step 2: Check each enrollment
        for idx, enrollment in enumerate(enrollments):
            enrollment_info = {
                "enrollment_id": enrollment.id,
                "class_id": enrollment.class_id,
                "class_name": enrollment.enrolled_class.name if enrollment.enrolled_class else "Unknown",
            }
            
            if enrollment.enrolled_class and enrollment.enrolled_class.user_teacher:
                teacher = enrollment.enrolled_class.user_teacher
                
                teacher_info = {
                    "teacher_id": teacher.id,
                    "teacher_email": teacher.email,
                    "first_name_raw": str(teacher.first_name)[:50] + "..." if teacher.first_name and len(str(teacher.first_name)) > 50 else teacher.first_name,
                    "first_name_type": str(type(teacher.first_name)),
                    "first_name_length": len(teacher.first_name) if teacher.first_name else 0,
                }
                
                # Try to decrypt with detailed error handling
                if teacher.first_name:
                    try:
                        # Log the exact value being passed to decrypt
                        print(f"Attempting to decrypt: {repr(teacher.first_name)}")
                        
                        # Check if it's a valid string
                        if not isinstance(teacher.first_name, str):
                            teacher_info["error"] = f"first_name is not a string: {type(teacher.first_name)}"
                            results["teachers_checked"].append(teacher_info)
                            continue
                        
                        # Try decryption
                        decrypted = decrypt_data(teacher.first_name)
                        teacher_info["decrypted"] = decrypted
                        teacher_info["success"] = True
                        
                        # Actually modify the teacher object like the original endpoint
                        teacher.first_name = decrypted
                        
                    except Exception as e:
                        teacher_info["success"] = False
                        teacher_info["error"] = str(e)
                        teacher_info["error_type"] = type(e).__name__
                        teacher_info["traceback"] = traceback.format_exc()
                        
                        # This is the key - if we get here, we found the problem teacher
                        results["error"] = f"Failed on teacher ID {teacher.id}: {str(e)}"
                
                enrollment_info["teacher"] = teacher_info
                results["teachers_checked"].append(enrollment_info)
            else:
                enrollment_info["teacher"] = None
                results["teachers_checked"].append(enrollment_info)
        
        # Step 3: Try to return the data exactly like the original endpoint
        results["steps"].append("Attempting to return data like original endpoint...")
        
        # This is exactly what your original endpoint does
        try:
            # Make a fresh query
            final_enrollments = (
                db.query(ClassEnrollment)
                .options(
                    joinedload(ClassEnrollment.enrolled_class)
                    .joinedload(Classes.user_teacher)
                )
                .filter(ClassEnrollment.student_id == 1)
                .filter(ClassEnrollment.status == "enrolled")
                .filter(ClassEnrollment.is_archive == False)
                .all()
            )
            
            # Decrypt
            for enrollment in final_enrollments:
                if enrollment.enrolled_class and enrollment.enrolled_class.user_teacher:
                    teacher = enrollment.enrolled_class.user_teacher
                    if teacher.first_name:
                        teacher.first_name = decrypt_data(teacher.first_name)
                    if teacher.last_name:
                        teacher.last_name = decrypt_data(teacher.last_name)
            
            # Convert to dict to avoid serialization issues
            result_data = []
            for enrollment in final_enrollments:
                enrollment_dict = {
                    "id": enrollment.id,
                    "class_id": enrollment.class_id,
                    "student_id": enrollment.student_id,
                    "enrollment_date": str(enrollment.enrollment_date) if enrollment.enrollment_date else None,
                    "status": enrollment.status,
                    "is_archive": enrollment.is_archive,
                }
                
                if enrollment.enrolled_class:
                    enrollment_dict["class"] = {
                        "id": enrollment.enrolled_class.id,
                        "name": enrollment.enrolled_class.name,
                    }
                    
                    if enrollment.enrolled_class.user_teacher:
                        teacher = enrollment.enrolled_class.user_teacher
                        enrollment_dict["class"]["teacher"] = {
                            "id": teacher.id,
                            "email": teacher.email,
                            "first_name": teacher.first_name,
                            "last_name": teacher.last_name,
                        }
                
                result_data.append(enrollment_dict)
            
            results["original_endpoint_data"] = result_data
            results["original_endpoint_success"] = True
            
        except Exception as e:
            results["original_endpoint_success"] = False
            results["original_endpoint_error"] = str(e)
            results["original_endpoint_traceback"] = traceback.format_exc()
        
        return results
        
    except Exception as e:
        results["error"] = str(e)
        results["traceback"] = traceback.format_exc()
        return results