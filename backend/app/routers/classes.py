from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from app.database import SessionLocal
from app.models.classes import Classes
from app.models.subject import Subject
from app.models.class_enrollment import ClassEnrollment
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
    
    # Use the safe decryption function that returns dicts
    return [safe_decrypt_class_dict(c) for c in classes]


@router.get("/getById/{class_id}", response_model=ClassOut)
def get_user_by_id(class_id: int , db: Session = Depends(get_db)):
    class_item = db.query(Classes).filter(Classes.id == class_id).first()
    
    if not class_item:
        return HTTPException(status_code=404, detail="class not found")
    
    # Use safe_decrypt_class_dict instead of modifying in-place
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

    # Use safe decryption for each class
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
            "academic_year": class_item.academic_year,
            "semester": class_item.semester,
            "lecture_units": class_item.lecture_units,
            "lab_units": class_item.lab_units,
            "is_archive": class_item.is_archive,
        }
        
        # Safely add teacher data
        if class_item.user_teacher:
            class_dict["user_teacher"] = safe_decrypt_teacher_dict(class_item.user_teacher)
        
        result.append(class_dict)
    
    return result


@router.post("/create")
def create_class(class_data: ClassCreate, db: Session = Depends(get_db)):
    
    existing_class = db.query(Classes).filter(
        Classes.name == class_data.name,
        Classes.section == class_data.section,
        Classes.academic_year == class_data.academic_year,
        Classes.semester == class_data.semester
    ).first()
    
    if existing_class:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A class named '{class_data.name}' with section '{class_data.section}' "
                   f"already exists for {class_data.semester} {class_data.academic_year}."
        )

    new_class = Classes(
        subject_id=class_data.subject_id,
        teacher_id=class_data.teacher_id,
        name=class_data.name,
        schedule=class_data.schedule,
        room=class_data.room,
        section=class_data.section,
        academic_year=class_data.academic_year,
        semester=class_data.semester,
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

            # 3. Check if subject exists or create it
            subject = db.query(Subject).filter(
                Subject.name == class_row.course_name
            ).first()
            
            if not subject:
                # Create new subject if it doesn't exist
                subject = Subject(
                    name=class_row.course_name,
                    description=f"Course: {class_row.course_name}"
                )
                db.add(subject)
                db.commit()
                db.refresh(subject)

            # 4. Check for duplicate class
            existing_class = db.query(Classes).filter(
                Classes.name == class_row.course_code,
                Classes.section == class_row.section,
                Classes.academic_year == class_row.academic_year,
                Classes.semester == class_row.semester,
                Classes.subject_id == subject.id,
                Classes.teacher_id == teacher.id
            ).first()

            if existing_class:
                errors.append(f"Row {index}: Class '{class_row.course_code}' with section '{class_row.section}' already exists for {class_row.semester} {class_row.academic_year}")
                skipped += 1
                continue

            # 5. Create the class
            new_class = Classes(
                subject_id=subject.id,
                teacher_id=teacher.id,
                name=class_row.course_code,
                schedule=class_row.schedule,
                room=class_row.room,
                section=class_row.section,
                academic_year=class_row.academic_year,
                semester=class_row.semester,
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