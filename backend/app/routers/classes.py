from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from app.database import SessionLocal
from app.models.classes import Classes
from app.models.subject import Subject
from app.models.class_enrollment import ClassEnrollment
from app.models.academic_semester_year import AcademicSemesterYear
from app.models.users import Users
from app.schemas.classes import ClassCreate, ClassUpdate, ClassOut, ClassWithTeacherOut, BulkUploadResponse, BulkClassUpload
from app.database import get_db
from app.utils.decryption import safe_decrypt_class_dict, safe_decrypt_teacher_dict 

router = APIRouter(prefix="/classes", tags=["classes"])


@router.get("/get", response_model=list[ClassOut])
def get_classes(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """
    Get all classes with safely decrypted teacher names.
    """
    classes = (
        db.query(Classes)
        .options(joinedload(Classes.user_teacher), joinedload(Classes.subject))
        .filter(Classes.is_archive == False)
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    return [safe_decrypt_class_dict(c) for c in classes]

@router.get("/get-by-semester/{semester_id}", response_model=list[ClassOut])
def get_classes_by_semester(
    semester_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all classes for a specific academic semester with batch decryption
    """
    # Get classes with joined data
    classes = db.query(Classes).filter(
        Classes.academic_semester_id == semester_id,
        Classes.is_archive == False
    ).options(
        joinedload(Classes.user_teacher),
        joinedload(Classes.subject)
    ).all()
    
    if not classes:
        return []
    
    # === BATCH DECRYPTION OPTIMIZATION ===
    # Collect all encrypted teacher names
    teacher_first_names = []
    teacher_last_names = []
    teacher_middle_names = []
    teacher_positions = []  # Track which class each teacher belongs to
    
    for idx, class_item in enumerate(classes):
        if class_item.user_teacher:
            teacher = class_item.user_teacher
            if teacher.first_name and teacher.first_name.startswith('gAAAAA'):
                teacher_first_names.append(teacher.first_name)
                teacher_positions.append((idx, 'first_name'))
            if teacher.last_name and teacher.last_name.startswith('gAAAAA'):
                teacher_last_names.append(teacher.last_name)
                teacher_positions.append((idx, 'last_name'))
            if teacher.middle_name and teacher.middle_name.startswith('gAAAAA'):
                teacher_middle_names.append(teacher.middle_name)
                teacher_positions.append((idx, 'middle_name'))
    
    # Batch decrypt all at once
    from app.utils.auth import safe_decrypt_data
    decrypted_first = [safe_decrypt_data(name) for name in teacher_first_names]
    decrypted_last = [safe_decrypt_data(name) for name in teacher_last_names]
    decrypted_middle = [safe_decrypt_data(name) for name in teacher_middle_names]
    
    # Create lookup maps
    first_map = dict(zip(teacher_first_names, decrypted_first))
    last_map = dict(zip(teacher_last_names, decrypted_last))
    middle_map = dict(zip(teacher_middle_names, decrypted_middle))
    
    # Build result with decrypted values
    result = []
    for class_item in classes:
        class_dict = {
            "id": class_item.id,
            "subject_id": class_item.subject_id,
            "teacher_id": class_item.teacher_id,
            "name": class_item.name,
            "is_archive": class_item.is_archive,
            "schedule": class_item.schedule,
            "room": class_item.room,
            "section": class_item.section,
            "lecture_units": class_item.lecture_units,
            "lab_units": class_item.lab_units,
            "academic_semester_id": class_item.academic_semester_id,
        }
        
        # Add teacher data with decrypted names
        if class_item.user_teacher:
            teacher = class_item.user_teacher
            teacher_dict = {
                "id": teacher.id,
                "email": teacher.email,  # Plain text
                "first_name": first_map.get(teacher.first_name, teacher.first_name) if teacher.first_name else None,
                "last_name": last_map.get(teacher.last_name, teacher.last_name) if teacher.last_name else None,
                "middle_name": middle_map.get(teacher.middle_name, teacher.middle_name) if teacher.middle_name else None,
                "role": teacher.role,
                "is_archive": teacher.is_archive,
                "must_change_password": teacher.must_change_password,
                "created_at": teacher.created_at,
            }
            class_dict["user_teacher"] = teacher_dict
        
        # Add subject data (assuming subject names aren't encrypted)
        if class_item.subject:
            class_dict["subject"] = {
                "id": class_item.subject.id,
                "name": class_item.subject.name,
                "description": class_item.subject.description,
                "created_at": class_item.subject.created_at,
                "is_archive": class_item.subject.is_archive,
            }
        
        result.append(class_dict)
    
    return result


@router.get("/getById/{class_id}", response_model=ClassOut)
def get_user_by_id(class_id: int , db: Session = Depends(get_db)):
    class_item = db.query(Classes).filter(Classes.id == class_id).first()
    
    if not class_item:
        return HTTPException(status_code=404, detail="class not found")
    
    return safe_decrypt_class_dict(class_item)


@router.get("/getByUserId/{teacher_id}", response_model=list[ClassWithTeacherOut])
def get_classes_by_user_id(teacher_id: int, db: Session = Depends(get_db)):
    classes = (
        db.query(Classes)
        .options(joinedload(Classes.user_teacher))  
        .filter(Classes.teacher_id == teacher_id)
        .all()
    )

    if not classes:
        raise HTTPException(status_code=404, detail="No classes found for this teacher")

    result = []
    for class_item in classes:
        class_dict = {
            "id": class_item.id,
            "subject_id": class_item.subject_id,
            "teacher_id": class_item.teacher_id,
            "name": class_item.name,
            "schedule": class_item.schedule,
            "room": class_item.room,
            "section": class_item.section,
            "lecture_units": class_item.lecture_units,
            "lab_units": class_item.lab_units,
            "is_archive": class_item.is_archive,
        }
        
        if class_item.user_teacher:
            class_dict["user_teacher"] = safe_decrypt_teacher_dict(class_item.user_teacher)
        
        result.append(class_dict)
    
    return result


@router.post("/create")
def create_class(class_data: ClassCreate, db: Session = Depends(get_db)):

    # Auto-fetch the current active semester
    current_semester = db.query(AcademicSemesterYear).filter(
        AcademicSemesterYear.current == True,
        AcademicSemesterYear.is_archive == False
    ).first()

    if not current_semester:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active academic semester found. Please set a current semester first."
        )

    # Look up subject to use its name as the class name
    subject = db.query(Subject).filter(Subject.id == class_data.subject_id).first()

    if not subject:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subject not found."
        )

    existing_class = db.query(Classes).filter(
        Classes.name == subject.name,
        Classes.section == class_data.section
    ).first()
    
    if existing_class:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A class named '{subject.name}' with section '{class_data.section}' already exists."
        )

    new_class = Classes(
        subject_id=class_data.subject_id,
        teacher_id=class_data.teacher_id,
        name=subject.name,
        schedule=class_data.schedule,
        room=class_data.room,
        section=class_data.section,
        academic_semester_id=current_semester.id,
        lecture_units=class_data.lecture_units,  
        lab_units=class_data.lab_units          
    )
    
    db.add(new_class)
    db.commit()
    db.refresh(new_class)
    
    return {"message": "Class Created Successfully", "class_id": new_class.id, "name": new_class.name}


@router.post("/bulk-upload", response_model=BulkUploadResponse)
def bulk_upload_classes(upload_data: BulkClassUpload, db: Session = Depends(get_db)):
    """
    Bulk upload classes from CSV data
    """
    # Auto-fetch the current active semester once for all rows
    current_semester = db.query(AcademicSemesterYear).filter(
        AcademicSemesterYear.current == True,
        AcademicSemesterYear.is_archive == False
    ).first()

    if not current_semester:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active academic semester found. Please set a current semester first."
        )

    created = 0
    skipped = 0
    errors = []

    for index, class_row in enumerate(upload_data.classes, start=1):
        try:
            # 1. Validate at least one unit > 0
            if class_row.lecture_units == 0 and class_row.lab_units == 0:
                errors.append(f"Row {index}: At least one unit (lecture or lab) must be greater than 0")
                skipped += 1
                continue

            # 2. Check if teacher exists by email
            teacher = db.query(Users).filter(
                Users.email == class_row.teacher_email,
                Users.role == "teacher"
            ).first()
            
            if not teacher:
                errors.append(f"Row {index}: Teacher with email '{class_row.teacher_email}' not found or not a teacher")
                skipped += 1
                continue

            # 3. Check if subject exists by course_code
            subject = db.query(Subject).filter(
                Subject.name == class_row.course_code
            ).first()

            if not subject:
                errors.append(f"Row {index}: Subject with course code '{class_row.course_code}' not found")
                skipped += 1
                continue

            # 4. Check for duplicate class
            existing_class = db.query(Classes).filter(
                Classes.name == class_row.course_code,
                Classes.section == class_row.section,
                Classes.subject_id == subject.id,
                Classes.teacher_id == teacher.id
            ).first()

            if existing_class:
                errors.append(f"Row {index}: Class '{class_row.course_code}' with section '{class_row.section}' already exists")
                skipped += 1
                continue

            # 5. Create the class with the current semester
            new_class = Classes(
                subject_id=subject.id,
                teacher_id=teacher.id,
                name=class_row.course_code,
                schedule=class_row.schedule,
                room=class_row.room,
                section=class_row.section,
                academic_semester_id=current_semester.id,
                lecture_units=class_row.lecture_units,
                lab_units=class_row.lab_units,
                is_archive=False
            )

            db.add(new_class)
            created += 1

        except Exception as e:
            errors.append(f"Row {index}: Error - {str(e)}")
            skipped += 1
            continue

    # Commit all valid classes at once
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

    return BulkUploadResponse(
        created=created,
        skipped=skipped,
        errors=errors[:20]
    )


@router.patch("/patch/{class_id}")
def patch_class(class_id: int, class_update: ClassUpdate, db: Session = Depends(get_db)):
    class_to_update = db.query(Classes).filter(Classes.id == class_id).first()
    
    if not class_to_update:
        raise HTTPException(status_code=404, detail="Class not Found")
    
    for key, value in class_update.model_dump(exclude_unset=True).items():
        setattr(class_to_update, key, value)
        
    db.commit()
    db.refresh(class_to_update)
    
    return {"message": f"Class with id {class_id} has been updated successfully"}


@router.patch("/archive/{class_id}")
def archive(class_id: int, db: Session = Depends(get_db)):
    classes = db.query(Classes).filter(Classes.id == class_id).first() 
    
    if not classes:
        raise HTTPException(status_code=404, detail="Class not Existing")
    
    existing_enrollments = db.query(ClassEnrollment).filter(
        ClassEnrollment.class_id == class_id,
        ClassEnrollment.is_archive == False
    ).first()
    
    if existing_enrollments:
        raise HTTPException(
            status_code=400,
            detail="Cannot archive class: existing enrollments bound to this class is found."
        )
        
    classes.is_archive = True
    
    db.commit()
    db.refresh(classes)
    
    return {"message": f"class with {class_id} archived successfully"}

# @router.get("/get-by-semester/{semester_id}", response_model=list[ClassOut])
# def get_classes_by_semester(
#     semester_id: int,
#     db: Session = Depends(get_db)
# ):
#     """
#     Get all classes for a specific academic semester
#     """
#     classes = db.query(Classes).filter(
#         Classes.academic_semester_id == semester_id,
#         Classes.is_archive == False
#     ).options(
#         joinedload(Classes.user_teacher),
#         joinedload(Classes.subject)
#     ).all()
    
#     return [safe_decrypt_class_dict(c) for c in classes]