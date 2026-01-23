# app/routers/exam.py
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.utils.tos import compute_tos
from app.schemas.exam.exam import (
    TOSRequest, CreateExam, ExamOut, ExamUpdate, 
    ArchiveExam, SimpleExamResponse, ExamListResponse
)
from app.schemas.exam.student_exam_progress import StudentExamProgressOut
from app.utils.generate_exam import generate_exam_realistic
from datetime import datetime, timezone
from app.models.exam.exams import Exam  
from app.models.exam.student_exam_progress import StudentExamProgress
from app.models.class_enrollment import ClassEnrollment
from app.models.class_material import ClassMaterial
from app.models.classes import Classes
from app.models.term import Term
from app.database import SessionLocal

router = APIRouter(prefix="/exam", tags=["exam"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# For Teachers
@router.get("/getExams/{class_id}", response_model=List[SimpleExamResponse])
async def get_exams_for_class(
    class_id: int,
    term: int = Query(..., description="Term ID"),
    is_archive: bool = Query(False, description="Include archived exams"),
    db: Session = Depends(get_db)
):
    """
    Get exams for a specific class and term for frontend display
    Endpoint: GET /exam/getExams/9?term=1
    """
    try:
        # Validate class exists
        class_exists = db.query(Classes).filter(Classes.id == class_id).first()
        if not class_exists:
            raise HTTPException(
                status_code=404,
                detail=f"Class with ID {class_id} not found"
            )
        
        # Validate term exists
        term_exists = db.query(Term).filter(Term.id == term).first()
        if not term_exists:
            raise HTTPException(
                status_code=404,
                detail=f"Term with ID {term} not found"
            )
        
        # Build query
        query = db.query(Exam).filter(
            Exam.class_id == class_id,
            Exam.term_id == term
        )
        
        # Filter by archive status if not requesting archived exams
        if not is_archive:
            query = query.filter(Exam.is_archive == False)
        
        # Order by creation date (newest first)
        exams = query.order_by(Exam.created_at.desc()).all()
        
        return exams
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve exams: {str(e)}"
        )

# For Students
@router.get("/student/exams/{class_id}", response_model=List[StudentExamProgressOut])
async def get_student_exams_for_class(
    class_id: int,
    student_id: int = Query(..., description="Student ID"),
    term: int = Query(None, description="Term ID (optional)"),
    db: Session = Depends(get_db)
):
    """
    Get all active exam progress records for a specific student in a specific class
    Endpoint: GET /exam/student/exams/9?student_id=123&term=1
    Returns: List of StudentExamProgress records for non-archived exams
    """
    try:
        
        query = db.query(StudentExamProgress).join(
            Exam,
            StudentExamProgress.exam_id == Exam.id
        ).filter(
            StudentExamProgress.student_id == student_id,
            Exam.class_id == class_id,
            Exam.is_archive == False  
        )
        
        
        if term is not None:
            query = query.filter(Exam.term_id == term)
        
        
        progress_records = query.order_by(StudentExamProgress.created_at.desc()).all()
        
        return progress_records
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve exam progress for student: {str(e)}"
        )

@router.get("/{exam_id}", response_model=ExamOut)
async def get_exam_by_id(
    exam_id: int,
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific exam
    """
    try:
        exam = db.query(Exam).filter(Exam.id == exam_id).first()
        
        if not exam:
            raise HTTPException(
                status_code=404,
                detail=f"Exam with ID {exam_id} not found"
            )
        
        return exam
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve exam: {str(e)}"
        )


@router.put("/{exam_id}", response_model=ExamOut)
async def update_exam(
    exam_id: int,
    exam_update: ExamUpdate,
    db: Session = Depends(get_db)
):
    """
    Update an existing exam
    """
    try:
        # Find the exam
        exam = db.query(Exam).filter(Exam.id == exam_id).first()
        
        if not exam:
            raise HTTPException(
                status_code=404,
                detail=f"Exam with ID {exam_id} not found"
            )
        
        # Update fields
        update_data = exam_update.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            if field != "class_material_ids":  # Handle this separately if needed
                setattr(exam, field, value)
        
        # Update timestamp
        exam.updated_at = datetime.now(timezone.utc)
        
        # Commit changes
        db.commit()
        db.refresh(exam)
        
        return exam
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update exam: {str(e)}"
        )


@router.post("/{exam_id}/archive")
async def archive_exam(
    exam_id: int,
    archive_data: ArchiveExam,
    db: Session = Depends(get_db)
):
    """
    Archive or unarchive an exam
    """
    try:
        # Find the exam
        exam = db.query(Exam).filter(Exam.id == exam_id).first()
        
        if not exam:
            raise HTTPException(
                status_code=404,
                detail=f"Exam with ID {exam_id} not found"
            )
        
        # Update archive status
        exam.is_archive = archive_data.is_archive
        exam.updated_at = datetime.now(timezone.utc)
        
        # Commit changes
        db.commit()
        db.refresh(exam)
        
        action = "archived" if archive_data.is_archive else "unarchived"
        return {
            "message": f"Exam successfully {action}",
            "exam_id": exam.id,
            "is_archive": exam.is_archive
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to archive exam: {str(e)}"
        )


@router.post("/{exam_id}/restore")
async def restore_exam(
    exam_id: int,
    db: Session = Depends(get_db)
):
    """
    Restore an archived exam (unarchive)
    """
    try:
        # Find the exam
        exam = db.query(Exam).filter(Exam.id == exam_id).first()
        
        if not exam:
            raise HTTPException(
                status_code=404,
                detail=f"Exam with ID {exam_id} not found"
            )
        
        # Restore the exam
        exam.is_archive = False
        exam.updated_at = datetime.now(timezone.utc)
        
        # Commit changes
        db.commit()
        db.refresh(exam)
        
        return {
            "message": "Exam successfully restored",
            "exam_id": exam.id,
            "is_archive": exam.is_archive
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to restore exam: {str(e)}"
        )

@router.post("/compute_tos")
async def generate_tos(data: TOSRequest):
    """
    Generate exam from Table of Specifications (async version)
    """
    try:
        lessons_data = [lesson.dict() for lesson in data.lessons]
        result = compute_tos(lessons_data, data.total_items)
        
        exam_questions = await generate_exam_realistic(result, target_total=data.total_items)
        
        print(f"✅ Generated {len(exam_questions)}/{data.total_items} questions")
        
        return {
            "success": True,
            "total_questions": len(exam_questions),
            "requested_items": data.total_items,
            "generated_items": len(exam_questions),
            "tos_distribution": result,
            "questions": exam_questions
        }
        
    except Exception as e:
        print(f"❌ Error in generate_tos endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate exam: {str(e)}"
        )
@router.get("/hello")
def hello():
    print("Lina")  # still logs on server
    return {"message": "Hello from Lina!"}


@router.post("/assignExam")
def assign_exam(exam: CreateExam, db: Session = Depends(get_db)):
    """
    Create and assign an exam to students and link to multiple lessons/materials
    """
    
    # Validate all class materials exist before starting transaction
    if exam.lesson_ids:
        existing_materials = db.query(ClassMaterial.id).filter(
            ClassMaterial.id.in_(exam.lesson_ids),
            ClassMaterial.class_id == exam.class_id
        ).all()
        existing_material_ids = {m.id for m in existing_materials}
        
        missing_materials = set(exam.lesson_ids) - existing_material_ids
        if missing_materials:
            raise HTTPException(
                status_code=404,
                detail=f"Class materials not found or don't belong to class: {missing_materials}"
            )
    
    
    if exam.assigned_students:
        
        active_enrollments = db.query(ClassEnrollment.student_id).filter(
            ClassEnrollment.student_id.in_(exam.assigned_students),
            ClassEnrollment.class_id == exam.class_id,
            ClassEnrollment.is_archive == False,  
            ClassEnrollment.status == "enrolled"    
        ).all()
        
        enrolled_student_ids = {e.student_id for e in active_enrollments}
        
       
        not_enrolled_students = set(exam.assigned_students) - enrolled_student_ids
        
        if not_enrolled_students:
            
            raise HTTPException(
                status_code=400,
                detail=f"Students not enrolled or not active in class: {not_enrolled_students}"
            )
            
            
    
    passing_score = round(exam.total_points * 0.75)
    
    try:
        
        new_exam = Exam(
            title=exam.title,
            total_points=exam.total_points,
            instructions=exam.instructions,
            exam_content=exam.exam_content,  
            duration=exam.duration,
            class_id=exam.class_id,
            is_archive=exam.is_archive,
            passing_score=passing_score,
            term_id=exam.term_id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        db.add(new_exam)
        db.flush()
        
        
        if exam.lesson_ids:
            materials = db.query(ClassMaterial).filter(
                ClassMaterial.id.in_(exam.lesson_ids)
            ).all()
            new_exam.class_materials.extend(materials)  
        
        
        student_progress_entries = []
        for student_id in exam.assigned_students:
            student_progress = StudentExamProgress(
                student_id=student_id,
                exam_id=new_exam.id,
                status="assigned",
                score=None,
                start_time=None,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            student_progress_entries.append(student_progress)
        
        db.add_all(student_progress_entries)
        db.commit()
        db.refresh(new_exam)

        return {
            "message": "Exam created and assigned successfully",
            "exam_id": new_exam.id,
            "assigned_students_count": len(exam.assigned_students),
            "linked_lessons_count": len(exam.lesson_ids) if exam.lesson_ids else 0,
            "linked_lesson_ids": exam.lesson_ids if exam.lesson_ids else []
        }

    except Exception as e:
        db.rollback()
        
        raise HTTPException(
            status_code=500,
            detail=f"Database error while creating exam: {str(e)}"
        )