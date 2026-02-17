
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.schemas.subject import SubjectCreate, SubjectOut, SubjectUpdate
from app.models.subject import Subject
from app.models.classes import Classes
from app.database import get_db

router = APIRouter(prefix="/subject", tags=["subject"])

        

@router.get("/get", response_model=list[SubjectOut])
def get_subjects(query: str | None = None, db: Session = Depends(get_db)):
    
    subjects = db.query(Subject).filter(Subject.is_archive == False)
    
    if query:
        subjects = subjects.filter(
        Subject.name.ilike(f"%{query}%")
    )
        
    subjects = subjects.order_by(Subject.id.asc()).all()
    
    return subjects
    
@router.get("/getById/{subject_id}", response_model=SubjectOut)
def get_subject_by_id(subject_id : int, db: Session = Depends(get_db)):
    
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    
    if not subject:
        raise HTTPException(status_code=404, detail="subject not found")
    
    return subject

@router.post("/create")
def create_subject(subject: SubjectCreate, db: Session = Depends(get_db)):
    
    
    existing_subject = db.query(Subject).filter(Subject.name == subject.name).first()
    
    if existing_subject:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Subject '{subject.name}' already exists."
        )

    
    new_subject = Subject(
        name = subject.name,
        description = subject.description
    )
    
    db.add(new_subject)
    db.commit()
    db.refresh(new_subject)
    
    return {"message": "Subject Created Successfully", "id": new_subject.id}

@router.patch("/update/{subject_id}")
def patch_subject(subject_id: int, subject_update: SubjectUpdate, db: Session = Depends(get_db)):
    
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")
    
    for key, value in subject_update.dict(exclude_unset=True).items():
        setattr(subject, key, value)
        
    db.commit()
    db.refresh(subject)
    
    return {"message" : f"Subject with {subject_id} has been updated."}
        
    
@router.patch("/archive/{subject_id}")
def archive_subject(subject_id: int, db: Session = Depends(get_db)):
    
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    existing_classes = db.query(Classes).filter(
        Classes.subject_id == subject_id, 
        Classes.is_archive == False
    ).first()
    
    if existing_classes:
        raise HTTPException(
                status_code=400,
                detail="Cannot archive subject: existing classes bound to this subject found."
            )
       

    subject.is_archive = True
    db.commit()
    db.refresh(subject)
    
    return {"message" : f"subject with {subject_id} has been archived"}