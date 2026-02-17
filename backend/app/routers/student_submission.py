import os
import json
import time
import asyncio
from fastapi import APIRouter, HTTPException, Depends, File, Form, UploadFile, Query
from typing import Optional
from sqlalchemy.orm import Session, joinedload
from app.database import SessionLocal
from app.schemas.student_submission import SubmissionCreate, SubmissionUpdate, SubmissionOut, SubmissionWithStudentOut
from app.models import StudentSubmission
from app.utils.r2_helper import upload_file_async, generate_presigned_url_async, delete_file
from app.models.class_enrollment import ClassEnrollment
import logging
from app.database import get_db

router = APIRouter(prefix="/student_submission", tags=["student_submission"])
logger = logging.getLogger(__name__)



# ✅ Check submission
@router.get("/check/{material_id}/{student_id}", response_model=Optional[SubmissionOut])
async def check_submission(material_id: int, student_id: int, db: Session = Depends(get_db)):
    """Check if student has submitted for a material"""
    start_time = time.time()
    
    try:
        # Fast database query
        submission = (
            db.query(StudentSubmission)
            .filter(
                StudentSubmission.material_id == material_id,
                StudentSubmission.student_id == student_id
            )
            .first()
        )

        if not submission:
            logger.info(f"Check submission - not found in {time.time() - start_time:.2f}s")
            return None

        # ✅ Generate presigned URL asynchronously
        file_url = None
        if submission.file_path:
            try:
                file_url = await generate_presigned_url_async(submission.file_path)
            except Exception as url_error:
                logger.error(f"Failed to generate presigned URL: {url_error}")
        
        result = SubmissionOut(
            id=submission.id,
            material_id=submission.material_id,
            student_id=submission.student_id,
            file_path=file_url,  
            submitted_at=submission.submitted_at,
            score=submission.score,
            remarks=submission.remarks,
            status=submission.status
        )
        
        logger.info(f"Check submission completed in {time.time() - start_time:.2f}s")
        return result
        
    except Exception as e:
        logger.error(f"Error in check_submission: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/upload")
async def submit_file(metadata: str = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Submit a file for a material"""
    start_time = time.time()
    stages = {}
    
    try:
        # Stage 1: Parse metadata
        stage_start = time.time()
        metadata_dict = json.loads(metadata)
        submission_data = SubmissionCreate(
            material_id=metadata_dict["materialId"],
            student_id=metadata_dict["studentId"],
        )
        stages["parse_metadata"] = time.time() - stage_start

        # Stage 2: Check existing submission
        stage_start = time.time()
        existing = (
            db.query(StudentSubmission)
            .filter(
                StudentSubmission.material_id == submission_data.material_id,
                StudentSubmission.student_id == submission_data.student_id
            )
            .first()
        )
        
        if existing and existing.file_path:
            logger.warning(f"Already submitted: material={submission_data.material_id}, student={submission_data.student_id}")
            raise HTTPException(status_code=400, detail="You have already submitted this material.")
        stages["check_existing"] = time.time() - stage_start

        # Stage 3: Read file
        stage_start = time.time()
        file_bytes = await file.read()
        file_size_mb = len(file_bytes) / (1024 * 1024)
        logger.info(f"File size: {file_size_mb:.2f}MB")
        stages["read_file"] = time.time() - stage_start

        # Stage 4: Upload file to R2 asynchronously
        stage_start = time.time()
        folder = f"submission/{submission_data.material_id}"
        file_key = await upload_file_async(file_bytes, file.filename, folder)
        stages["r2_upload"] = time.time() - stage_start

        # Stage 5: Save to database
        stage_start = time.time()
        if not existing:
            submission = StudentSubmission(
                material_id=submission_data.material_id,
                student_id=submission_data.student_id,
                file_path=file_key,
                status="submitted"
            )
            db.add(submission)
        else:
            existing.file_path = file_key
            existing.status = "submitted"
            submission = existing

        db.commit()
        db.refresh(submission)
        stages["db_save"] = time.time() - stage_start

        # Stage 6: Generate presigned URL asynchronously
        stage_start = time.time()
        file_url = await generate_presigned_url_async(file_key)
        stages["generate_url"] = time.time() - stage_start

        # Log performance
        total_time = time.time() - start_time
        logger.info(f"📊 Upload completed in {total_time:.2f}s. Stages: {stages}")
        
        if total_time > 10:
            logger.warning(f"⚠️ Slow upload: {total_time:.2f}s")

        return {
            "message": "File submitted successfully", 
            "submission_id": submission.id,
            "file_url": file_url  # Return URL immediately to avoid extra API call
        }

    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid metadata JSON format.")
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing field in metadata: {str(e)}")
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        db.rollback()
        logger.error(f"Upload failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Upload failed. Please try again.")

@router.patch("/unsubmit/{submission_id}")
def unsubmit_file(submission_id: int, db: Session = Depends(get_db)):
    """Unsubmit a submission"""
    submission = db.query(StudentSubmission).filter(StudentSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # ✅ Prevent unsubmit if already graded
    if submission.score is not None or submission.remarks is not None:
        raise HTTPException(status_code=400, detail="Cannot unsubmit after submission has been graded.")

    try:
        # Delete file from R2 storage
        if submission.file_path:
            delete_file(submission.file_path)

        submission.file_path = None
        submission.status = "unsubmitted"
        db.commit()
        db.refresh(submission)

        return {"message": "Submission removed successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ✅ Teacher grading
@router.patch("/update_score/{submission_id}")
def update_score_remarks(submission_id: int, payload: SubmissionUpdate, db: Session = Depends(get_db)):
    """Update score and remarks for a submission"""
    submission = db.query(StudentSubmission).filter(StudentSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    try:
        if payload.score is not None:
            submission.score = payload.score
        if payload.remarks is not None:
            submission.remarks = payload.remarks
        submission.status = "graded"
        db.commit()
        db.refresh(submission)

        return {"message": "Score and remarks updated successfully."}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats/{material_id}")
def get_submission_stats(material_id: int, class_id: int = Query(...), db: Session = Depends(get_db)):
    """Get submission statistics for a material"""
    
    total_submissions = db.query(StudentSubmission).filter(
        StudentSubmission.material_id == material_id
    ).count()
    
    number_of_students = db.query(ClassEnrollment).filter(
        ClassEnrollment.class_id == class_id
    ).count()

    scored_submissions = db.query(StudentSubmission).filter(
        StudentSubmission.material_id == material_id,
        StudentSubmission.score.isnot(None)
    ).count()

    return {
        "material_id": material_id,
        "total_submissions": total_submissions,
        "scored_submissions": scored_submissions,
        "number_of_students": number_of_students
    }

@router.get("/material/{material_id}", response_model=list[SubmissionWithStudentOut])
def get_submissions_by_material(material_id: int, db: Session = Depends(get_db)):
    """Get all submissions for a material"""
    
    # Query submissions with student data joined
    submissions = db.query(StudentSubmission).options(
        joinedload(StudentSubmission.student)
    ).filter(
        StudentSubmission.material_id == material_id,
        StudentSubmission.file_path.isnot(None),
        StudentSubmission.file_path != ""
    ).all()

    if not submissions:
        raise HTTPException(
            status_code=404,
            detail=f"No submitted files found for material_id {material_id}"
        )

    # Sort submissions alphabetically by student name (last name, then first name, then middle name)
    submissions.sort(key=lambda x: (
        (x.student.last_name or "").lower(),
        (x.student.first_name or "").lower(),
        (x.student.middle_name or "").lower()
    ))

    return submissions

@router.get("/get_url/{submission_id}")
async def get_submission_file(submission_id: int, db: Session = Depends(get_db)):
    """Get presigned URL for a specific submission"""
    submission = db.query(StudentSubmission).filter_by(id=submission_id).first()
    if not submission or not submission.file_path:
        raise HTTPException(404, "File not found")

    url = await generate_presigned_url_async(submission.file_path)
    return {"url": url}