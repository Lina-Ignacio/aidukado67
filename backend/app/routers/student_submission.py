import os
from fastapi import APIRouter, HTTPException, Depends, File, Form, UploadFile
from typing import Optional
from sqlalchemy.orm import Session, joinedload
from app.database import SessionLocal
from app.schemas.student_submission import SubmissionCreate, SubmissionUpdate, SubmissionOut, SubmissionWithStudentOut
from app.models import StudentSubmission
from app.utils.r2_helper import upload_file, generate_presigned_url, delete_file
import json

router = APIRouter(prefix="/student_submission", tags=["student_submission"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ✅ Check submission
@router.get("/check/{material_id}/{student_id}", response_model=Optional[SubmissionOut])
def check_submission(material_id: int, student_id: int, db: Session = Depends(get_db)):
    submission = (
        db.query(StudentSubmission)
        .filter(
            StudentSubmission.material_id == material_id,
            StudentSubmission.student_id == student_id
        )
        .first()
    )

    if not submission:
        return None

    # ✅ Generate a presigned URL if the file exists
    if submission.file_path:
        file_url = generate_presigned_url(submission.file_path)
    else:
        file_url = None

    
    submission_out = SubmissionOut(
        id=submission.id,
        material_id=submission.material_id,
        student_id=submission.student_id,
        file_path=file_url,  
        submitted_at=submission.submitted_at,
        score=submission.score,
        remarks=submission.remarks,
        status=submission.status
    )

    return submission_out

@router.post("/upload")
async def submit_file(metadata: str = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        metadata_dict = json.loads(metadata)
        submission_data = SubmissionCreate(
            material_id=metadata_dict["materialId"],
            student_id=metadata_dict["studentId"],
        )

        existing = (
            db.query(StudentSubmission)
            .filter(
                StudentSubmission.material_id == submission_data.material_id,
                StudentSubmission.student_id == submission_data.student_id
            )
            .first()
        )
        if existing and existing.file_path:
            raise HTTPException(status_code=400, detail="You have already submitted this material.")

        # Upload file first
        file_bytes = await file.read()
        folder = f"submission/{submission_data.material_id}"
        file_key = upload_file(file_bytes, file.filename, folder)

        # Save to DB
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

        return {"message": "File submitted successfully", "submission_id": submission.id}

    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid metadata JSON format.")
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing field in metadata: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/unsubmit/{submission_id}")
def unsubmit_file(submission_id: int, db: Session = Depends(get_db)):
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
def get_submission_stats(material_id: int, db: Session = Depends(get_db)):

    total_submissions = db.query(StudentSubmission).filter(
        StudentSubmission.material_id == material_id
    ).count()

    if total_submissions == 0:
        raise HTTPException(
            status_code=404,
            detail=f"No submissions found for material_id {material_id}"
        )

    scored_submissions = db.query(StudentSubmission).filter(
        StudentSubmission.material_id == material_id,
        StudentSubmission.score.isnot(None)
    ).count()

    return {
        "material_id": material_id,
        "total_submissions": total_submissions,
        "scored_submissions": scored_submissions
    }


@router.get("/material/{material_id}", response_model=list[SubmissionWithStudentOut])
def get_submissions_by_material(material_id: int, db: Session = Depends(get_db)):

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

    return submissions

@router.get("/get_url/{submission_id}")
def get_submission_file(submission_id: int, db: Session = Depends(get_db)):
    submission = db.query(StudentSubmission).filter_by(id=submission_id).first()
    if not submission or not submission.file_path:
        raise HTTPException(404, "File not found")

    url = generate_presigned_url(submission.file_path)
    return {"url": url}
