from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload
from app.models import ClassEnrollment, Users, Classes
from app.schemas.class_enrollment import (EnrollmentCreate, EnrollmentOut, 
    EnrollmentUpdate, EnrollmentClassOut, EnrollmentImportRequest, EnrollmentImportResponse, CSVRow, EnrollmentTableOut)
from app.database import SessionLocal
from app.database import get_db
from app.utils.decryption import safe_decrypt_data, safe_decrypt_teacher, batch_decrypt_enrollment_names
import io
import csv
from datetime import date
from typing import List, Optional

router = APIRouter(prefix="/enrollment", tags=["enrollment"])

@router.get("/getByUserId/{user_id}", response_model=list[EnrollmentClassOut])
def get_classes_by_user(user_id: int, db: Session = Depends(get_db)):
    """
    Get all classes for a specific user with safely decrypted teacher names.
    """
    try:
        print(f"=== get_classes_by_user called for user_id: {user_id} ===")
        
        # First, check if user exists
        user = db.query(Users).filter(Users.id == user_id).first()
        print(f"User found: {user is not None}")
        if not user:
            print(f"User {user_id} not found")
            return []
        
        # Check enrollments without the joinedload first
        simple_enrollments = db.query(ClassEnrollment).filter(
            ClassEnrollment.student_id == user_id,
            ClassEnrollment.status == "enrolled",
            ClassEnrollment.is_archive == False
        ).all()
        
        print(f"Found {len(simple_enrollments)} enrollments")
        
        if len(simple_enrollments) == 0:
            print("No enrollments found")
            return []
        
        # Now try with joinedload
        enrollments = (
            db.query(ClassEnrollment)
            .options(
                joinedload(ClassEnrollment.enrolled_class)
                .joinedload(Classes.user_teacher)
            )
            .filter(ClassEnrollment.student_id == user_id)
            .filter(ClassEnrollment.status == "enrolled")
            .filter(ClassEnrollment.is_archive == False)
            .filter(Classes.is_archive == False)
            .all()
        )
        
        print(f"Enrollments with joinedload: {len(enrollments)}")
        
        result = []
        for enrollment in enrollments:
            try:
                print(f"Processing enrollment ID: {enrollment.id}")
                print(f"Has enrolled_class: {enrollment.enrolled_class is not None}")
                
                enrollment_dict = {
                    "id": enrollment.id,
                    "class_id": enrollment.class_id,
                    "student_id": enrollment.student_id,
                    "enrollment_date": enrollment.enrollment_date,
                    "status": enrollment.status,
                    "is_archive": enrollment.is_archive,
                }
                
                if enrollment.enrolled_class:
                    class_obj = enrollment.enrolled_class
                    print(f"Class ID: {class_obj.id}, Class Name: {class_obj.name}")
                    
                    class_dict = {
                        "id": class_obj.id,
                        "subject_id": class_obj.subject_id,
                        "teacher_id": class_obj.teacher_id,
                        "name": class_obj.name,
                        "is_archive": class_obj.is_archive,
                        "schedule": class_obj.schedule,
                        "room": class_obj.room,
                        "section": class_obj.section,
                        "academic_semester_id": class_obj.academic_semester_id,
                        "lecture_units": class_obj.lecture_units,
                        "lab_units": class_obj.lab_units,
                    }
                    
                    if class_obj.user_teacher:
                        teacher = class_obj.user_teacher
                        print(f"Teacher ID: {teacher.id}, Email: {teacher.email}")
                        
                        try:
                            # Try to decrypt teacher data
                            decrypted_first = safe_decrypt_data(teacher.first_name) if teacher.first_name else None
                            decrypted_last = safe_decrypt_data(teacher.last_name) if teacher.last_name else None
                            decrypted_middle = safe_decrypt_data(teacher.middle_name) if teacher.middle_name else None
                            
                            class_dict["user_teacher"] = {
                                "id": teacher.id,
                                "email": teacher.email,
                                "first_name": decrypted_first,
                                "last_name": decrypted_last,
                                "middle_name": decrypted_middle,
                                "role": teacher.role,
                                "is_archive": teacher.is_archive,
                                "must_change_password": teacher.must_change_password,
                                "created_at": teacher.created_at,
                            }
                            print("Teacher data decrypted successfully")
                        except Exception as e:
                            print(f"Error decrypting teacher data: {str(e)}")
                            class_dict["user_teacher"] = None
                    else:
                        print("No teacher assigned to class")
                        class_dict["user_teacher"] = None
                    
                    enrollment_dict["enrolled_class"] = class_dict
                else:
                    print("No enrolled_class found")
                    enrollment_dict["enrolled_class"] = None
                
                result.append(enrollment_dict)
                print(f"Successfully processed enrollment {enrollment.id}")
                
            except Exception as e:
                print(f"Error processing enrollment {enrollment.id}: {str(e)}")
                import traceback
                traceback.print_exc()
                continue
        
        print(f"Returning {len(result)} results")
        return result
        
    except Exception as e:
        print(f"ERROR in get_classes_by_user: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/get", response_model=list[EnrollmentTableOut])
def get_enrollments(
    semester_id: int | None = None,
    db: Session = Depends(get_db)
):
    """
    Get all enrollments with safely decrypted student names.
    Optionally filter by academic semester.
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
        # .filter(Classes.is_archive == False)
    )

    if semester_id:
        q = q.filter(Classes.academic_semester_id == semester_id)

    enrollments = q.order_by(ClassEnrollment.enrollment_date.desc()).all()
    
    result = []
    for enrollment in enrollments:
        enrollment_dict = enrollment._asdict()
        enrollment_dict['student_first_name'] = safe_decrypt_data(enrollment_dict.get('student_first_name'))
        enrollment_dict['student_last_name'] = safe_decrypt_data(enrollment_dict.get('student_last_name'))
        result.append(enrollment_dict)
    
    return result

# @router.get("/get-filtered-by-acad", response_model=list[EnrollmentTableOut])
# def get_filtered_by_acad(
#     semester_id: int | None = None,
#     db: Session = Depends(get_db)
# ):
#     """
#     Get all enrollments with safely decrypted student names.
#     Optionally filter by academic semester.
#     """
#     q = (
#         db.query(
#             ClassEnrollment.id,
#             ClassEnrollment.class_id,
#             ClassEnrollment.student_id,
#             ClassEnrollment.enrollment_date,
#             ClassEnrollment.status,
#             Users.first_name.label('student_first_name'),
#             Users.last_name.label('student_last_name'),
#             Classes.name.label('class_name')
#         )
#         .join(Users, ClassEnrollment.student_id == Users.id)
#         .join(Classes, ClassEnrollment.class_id == Classes.id)
#         .filter(ClassEnrollment.is_archive == False)
#         .filter(Users.is_archive == False)
#         # .filter(Classes.is_archive == False)
#     )

#     if semester_id:
#         q = q.filter(Classes.academic_semester_id == semester_id)

#     enrollments = q.order_by(ClassEnrollment.enrollment_date.desc()).all()
    
#     result = []
#     for enrollment in enrollments:
#         enrollment_dict = enrollment._asdict()
#         enrollment_dict['student_first_name'] = safe_decrypt_data(enrollment_dict.get('student_first_name'))
#         enrollment_dict['student_last_name'] = safe_decrypt_data(enrollment_dict.get('student_last_name'))
#         result.append(enrollment_dict)
    
#     return result


@router.get("/get-filtered", response_model=List[EnrollmentTableOut])
def get_enrollments_filtered(
    query: Optional[str] = Query(None, description="Search query for class name or status"),
    semester_id: Optional[int] = Query(None, description="Filter by academic semester ID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    """
    Get filtered enrollments with safely decrypted student names.
    Filters by class name, status, and optionally by academic semester.
    Supports pagination for better performance.
    """
    try:
        # Base query - only select what you need
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

        # Apply filters
        if semester_id:
            q = q.filter(Classes.academic_semester_id == semester_id)

        if query and query.strip():
            search = f"%{query.strip()}%"
            q = q.filter(
                or_(
                    Classes.name.ilike(search),
                    ClassEnrollment.status.ilike(search)
                )
            )

        # Get total count for pagination metadata (optional)
        total_count = q.count()
        
        # Apply pagination
        enrollments = (
            q.order_by(ClassEnrollment.enrollment_date.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        
        if not enrollments:
            return []
        
        # Batch decrypt all names at once (OPTIMIZATION!)
        result = batch_decrypt_enrollment_names(enrollments)
        
        # Optional: Add pagination headers
        # You can return total_count in response headers or modify response model
        # response.headers["X-Total-Count"] = str(total_count)
        # response.headers["X-Page"] = str(page)
        # response.headers["X-Page-Size"] = str(page_size)
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching filtered enrollments: {str(e)}"
        )


@router.get("/getById/{enrollment_id}", response_model=EnrollmentOut)
def get_enrollment(enrollment_id: int, db: Session = Depends(get_db)):
    enrollment = db.query(ClassEnrollment).filter(ClassEnrollment.id == enrollment_id).first()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment Data not Found")
    
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
        csv_data = io.StringIO(request.file_content)
        reader = csv.DictReader(csv_data)
        
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
            raise HTTPException(status_code=400, detail="CSV file is empty")
        
        db.begin()
        
        try:
            class_obj = db.query(Classes).filter(
                Classes.id == request.class_id,
                Classes.is_archive == False
            ).first()
            
            if not class_obj:
                raise HTTPException(status_code=404, detail="Class not found or archived")
            
            users = db.query(Users).filter(
                Users.email.in_(emails),
                Users.is_archive == False
            ).all()
            
            user_dict = {user.email.lower(): user for user in users}
            
            failed_emails = []
            for row in rows:
                if row.email not in user_dict:
                    failed_emails.append(row.email)
                    continue
                
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
            
            existing_enrollments = db.query(ClassEnrollment).filter(
                ClassEnrollment.class_id == request.class_id,
                ClassEnrollment.student_id.in_([user.id for user in users]),
                ClassEnrollment.is_archive == False
            ).all()
            
            existing_student_ids = {enrollment.student_id for enrollment in existing_enrollments}
            
            success_count = 0
            for row in rows:
                user = user_dict[row.email]
                
                if user.id in existing_student_ids:
                    continue
                
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
            raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.get("/debug/check-user-enrollments/{user_id}")
def debug_user_enrollments(user_id: int, db: Session = Depends(get_db)):
    """
    Debug route to check the exact enrollment path for a specific user
    """
    from app.utils.auth import decrypt_data
    
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
        
        if enrollment.enrolled_class and enrollment.enrolled_class.user_teacher:
            teacher = enrollment.enrolled_class.user_teacher
            teacher_data = {
                "teacher_id": teacher.id,
                "teacher_email": teacher.email,
                "first_name_raw_preview": str(teacher.first_name)[:50] + "..." if teacher.first_name else None,
                "last_name_raw_preview": str(teacher.last_name)[:50] + "..." if teacher.last_name else None,
            }
            
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
                
                if teacher.first_name:
                    try:
                        print(f"Attempting to decrypt: {repr(teacher.first_name)}")
                        
                        if not isinstance(teacher.first_name, str):
                            teacher_info["error"] = f"first_name is not a string: {type(teacher.first_name)}"
                            results["teachers_checked"].append(teacher_info)
                            continue
                        
                        decrypted = decrypt_data(teacher.first_name)
                        teacher_info["decrypted"] = decrypted
                        teacher_info["success"] = True
                        teacher.first_name = decrypted
                        
                    except Exception as e:
                        teacher_info["success"] = False
                        teacher_info["error"] = str(e)
                        teacher_info["error_type"] = type(e).__name__
                        teacher_info["traceback"] = traceback.format_exc()
                        results["error"] = f"Failed on teacher ID {teacher.id}: {str(e)}"
                
                enrollment_info["teacher"] = teacher_info
                results["teachers_checked"].append(enrollment_info)
            else:
                enrollment_info["teacher"] = None
                results["teachers_checked"].append(enrollment_info)
        
        results["steps"].append("Attempting to return data like original endpoint...")
        
        try:
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
            
            for enrollment in final_enrollments:
                if enrollment.enrolled_class and enrollment.enrolled_class.user_teacher:
                    teacher = enrollment.enrolled_class.user_teacher
                    if teacher.first_name:
                        teacher.first_name = decrypt_data(teacher.first_name)
                    if teacher.last_name:
                        teacher.last_name = decrypt_data(teacher.last_name)
            
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