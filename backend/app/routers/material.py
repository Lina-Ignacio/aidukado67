
from fastapi import APIRouter, HTTPException, Depends, File, Form, UploadFile
from typing import List
from sqlalchemy.orm import Session, load_only
from app.database import SessionLocal
import json
from app.schemas.material import MaterialCreate, MaterialOut, MaterialTitleOut, MaterialUpdate
from app.utils.r2_helper import upload_file, generate_presigned_url, delete_file
from app.utils.extract_text_from_file import extract_text_from_file
from app.models import ClassMaterial, LessonContent, Classes, Term
from app.models.summary import Summary
from app.schemas.summary import CreateSummary, SummaryOut
from app.database import get_db
import requests
from datetime import datetime


router = APIRouter(prefix="/class_material", tags=["class_material"])



        
@router.post("/upload")
async def upload_material(metadata: str = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db)):
    
    try:
        metadata_dict = json.loads(metadata)

        due_date_str = metadata_dict.get("dueDate")

        due_date = None
        if due_date_str:
            due_date = datetime.fromisoformat(due_date_str)

        material_data = MaterialCreate(
            class_id=metadata_dict["classId"],
            term_id=metadata_dict["termId"],
            title=metadata_dict["title"],
            description=metadata_dict["description"],
            type=metadata_dict["type"],
            total_score=metadata_dict["totalScore"],
            due_date=due_date
        )

        file_bytes = await file.read()

        folder = material_data.type
        file_key = upload_file(file_bytes, file.filename, folder)
        

        material = ClassMaterial(
            class_id=material_data.class_id,
            term_id=material_data.term_id,
            title=material_data.title,
            description=material_data.description,
            file_url=file_key,
            type=material_data.type,
            total_score=material_data.total_score,
            due_date=material_data.due_date,
            is_archive=False
        )

        db.add(material)
        db.flush()  
        
        if material_data.type == "lesson":
            try:
                extracted_content = extract_text_from_file(file_bytes, file.filename)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"File extraction failed: {e}")

            content = LessonContent(
                material_id=material.id,
                extracted_content=extracted_content
            )

            db.add(content)

        db.commit()
        db.refresh(material)

        return {"message": "Material uploaded successfully", "material_id": material.id}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/getByClassId/{class_id}", response_model=list[MaterialTitleOut])
def get_lessons_by_class(class_id: int, db: Session = Depends(get_db)):

    try:
        class_exist = db.query(Classes).filter(Classes.id == class_id).first()
    
        if not class_exist:
            raise HTTPException(
                status_code=404,
                detail=f"Class with ID {class_id} not found."
            )
        
        lessons = (
            db.query(ClassMaterial)
            .options(load_only(
                ClassMaterial.id,
                ClassMaterial.title,
                ClassMaterial.term_id,
                ClassMaterial.type,
                ClassMaterial.created_at,
                ClassMaterial.total_score,
                ClassMaterial.due_date
            ))
            .filter(
                ClassMaterial.class_id == class_id,
                ClassMaterial.is_archive == False  
            )
            .order_by(ClassMaterial.id.desc())
            .all()
        )

        return [MaterialTitleOut.model_validate(lesson) for lesson in lessons]
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
        
        
@router.get("/getByClassId/{class_id}/term/{term_id}", response_model=list[MaterialTitleOut])
def get_lessons_by_class_and_term(
    class_id: int, 
    term_id: int,
    db: Session = Depends(get_db)
):
    try:
        
        class_exist = db.query(Classes).filter(Classes.id == class_id).first()
        if not class_exist:
            raise HTTPException(
                status_code=404,
                detail=f"Class with ID {class_id} not found."
            )
        
        
        term_exist = db.query(Term).filter(Term.id == term_id).first()
        if not term_exist:
            raise HTTPException(
                status_code=404,
                detail=f"Term with ID {term_id} not found."
            )
        
        lessons = (
            db.query(ClassMaterial)
            .options(load_only(
                ClassMaterial.id,
                ClassMaterial.title,
                ClassMaterial.term_id,
                ClassMaterial.type,
                ClassMaterial.created_at
            ))
            .filter(
                ClassMaterial.class_id == class_id,
                ClassMaterial.term_id == term_id,  
                ClassMaterial.is_archive == False  
            )
            .order_by(ClassMaterial.id.desc())
            .all()
        )

        return [MaterialTitleOut.model_validate(lesson) for lesson in lessons]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/getMaterialById/{material_id}", response_model=MaterialOut, response_model_by_alias=True)
def get_lesson_by_id(material_id: int, db: Session = Depends(get_db)):
    material = db.query(ClassMaterial).filter(ClassMaterial.id == material_id).first()
        
    if not material:
        raise HTTPException(status_code=404, detail="Lesson not Found")
    
    if not material.file_url:
        raise HTTPException(status_code=400, detail="Lesson has no file URL")
    
    file_key = material.file_url
    file_url = generate_presigned_url(file_key)
    print(file_key)
    print(f"DEBUG: material.due_date value is: {material.due_date}")
    
    return MaterialOut(
        title=material.title,
        description=material.description,
        file_key=file_key,
        file_url=file_url,
        type=material.type,
        due_date=material.due_date,
        total_score=material.total_score,
        created_at=material.created_at
    )



@router.patch("/toggleArchive/{material_id}")
def toggle_archive(material_id: int, db: Session = Depends(get_db)):
    material = db.query(ClassMaterial).filter(ClassMaterial.id == material_id).first()

    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    material.is_archive = not material.is_archive  
    db.commit()
    db.refresh(material)

    return {
        "message": f"Material archive status set to {material.is_archive}",
        "data": material
    }

@router.patch("/updateMaterial/{material_id}")
async def update_material(material_id: int, metadata: str = Form(...), file: UploadFile = None, db: Session = Depends(get_db)):
    material = db.query(ClassMaterial).filter(ClassMaterial.id == material_id).first()
    
    if not material:
        raise HTTPException(status_code=404, detail="Lesson not existing")
    
    try:
        data = json.loads(metadata)
        material_update = MaterialUpdate.model_validate(data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid metadata JSON")
    
    for key, value in material_update.model_dump(exclude_unset=True).items():
        setattr(material, key, value)
        
    if file and file.filename:
        contents = await file.read()
        if contents:
            await file.seek(0)
            if material.file_key:
                delete_file(material.file_key)  
            file_key = upload_file(contents, file.filename, "lesson")
            material.file_url = file_key

    db.commit()
    db.refresh(material)
    
    return {"message": "Material updated successfully"}



   

# @router.get("/getSummary/{lesson_id}")
# async def summary(lesson_id: int, db: Session = Depends(get_db)):
#     summary = db.query(Summary).filter(Summary.lesson_id == lesson_id).first()
#     return summary






    
    