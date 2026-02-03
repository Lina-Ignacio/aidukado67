
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload
from app.models import ClassEnrollment, Users, Classes
from app.schemas.class_enrollment import EnrollmentCreate, EnrollmentOut, EnrollmentUpdate, EnrollmentClassOut
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