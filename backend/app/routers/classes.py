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

router = APIRouter(prefix="/classes", tags=["classes"])





@router.get("/get", response_model=list[ClassOut])
def get_classes(query: str | None = None, db: Session = Depends(get_db)):
    
    classes = (
        db.query(Classes)
        .options(
            joinedload(Classes.subject),
            joinedload(Classes.user_teacher)
        ).filter(Classes.is_archive == False)
    )
    
    if query:
        classes = (
            classes
            .join(Classes.subject)
            .join(Classes.user_teacher)
            .filter(
            or_(
                Classes.name.ilike(f"%{query}%"),
                Classes.academic_year.ilike(f"%{query}%"),
                Subject.name.ilike(f"%{query}%")
            )
        )
            )

    classes = classes.order_by(Classes.id.asc()).all()

   
    return classes

@router.get("/getById/{class_id}", response_model=ClassOut)
def get_user_by_id(class_id: int , db: Session = Depends(get_db)):
    new_class = db.query(Classes).filter(Classes.id == class_id).first()
    
    if not new_class:
        return HTTPException(status_code=404, detail="class not found")
        
    return new_class

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

    return classes


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
        subject_id = class_data.subject_id,
        teacher_id = class_data.teacher_id,
        name = class_data.name,
        schedule = class_data.schedule,
        room = class_data.room,
        section = class_data.section,
        academic_year = class_data.academic_year,
        semester = class_data.semester,
        lecture_units = class_data.lecture_units,  
        lab_units = class_data.lab_units          
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

            # 4. Check for duplicate class (strict check on all unique fields)
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

            # 5. Create the class with ALL database columns
            new_class = Classes(
                subject_id=subject.id,
                teacher_id=teacher.id,
                name=class_row.course_code,           # Maps from CSV course_code
                schedule=class_row.schedule,
                room=class_row.room,
                section=class_row.section,
                academic_year=class_row.academic_year,
                semester=class_row.semester,
                lecture_units=class_row.lecture_units,
                lab_units=class_row.lab_units,
                is_archive=False  # Default value for new classes
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
        errors=errors[:20]  # Limit errors to prevent huge response
    )
# @router.put("/update/{class_id}")
# def update_class(class_id:int, class_data:ClassCreate, db: Session = Depends(get_db)):
#     class_ = db.query(Classes).filter(Classes.id == class_id).first()

#     if not class_:
#         return {"message": "Class not found"}

#     class_.name = class_data.name
#     class_.subject_id = class_data.subject_id
#     class_.teacher_id = class_data.teacher_id
    
#     db.commit()
#     db.refresh(class_)
    
#     return {"message": "Class updated successfully"}


@router.patch("/patch/{class_id}")
def patch_class(class_id : int, class_update: ClassUpdate, db: Session = Depends(get_db)):
    class_to_update = db.query(Classes).filter(Classes.id == class_id).first()
    
    if not class_to_update:
        raise HTTPException(status_code=404, detail="Class not Found")
    
    for key, value in class_update.model_dump(exclude_unset=True).items():
        setattr(class_to_update, key, value)
        
    db.commit()
    db.refresh(class_to_update)
    
    return {"message" : f"Class with id ${class_id} has been updated successfully"}

@router.patch("/archive/{class_id}")
def archive(class_id : int, db: Session = Depends(get_db)):
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
    
    return {"message" : f"class with {class_id} archived successfully"}

