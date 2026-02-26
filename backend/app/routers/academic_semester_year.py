from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.academic_semester_year import AcademicSemesterYear
from app.schemas.academic_semester_year import AcademicSemesterYearOut, AcademicSemesterYearCreate
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/academic-semesters", tags=["academic-semesters"])

@router.get("/get", response_model=List[AcademicSemesterYearOut])
def get_academic_semesters(
    include_archived: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(AcademicSemesterYear)
    if not include_archived:
        query = query.filter(AcademicSemesterYear.is_archive == False)
    return query.order_by(
        AcademicSemesterYear.academic_year.desc(),
        AcademicSemesterYear.semester
    )


@router.get("/get-current", response_model=AcademicSemesterYearOut)
def get_current_academic_semester(db: Session = Depends(get_db)):
    current_semester = db.query(AcademicSemesterYear).filter(
        AcademicSemesterYear.current == True,
        AcademicSemesterYear.is_archive == False
    ).first()
    if not current_semester:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No current academic semester found"
        )
    return current_semester


@router.get("/get-by-id/{semester_id}", response_model=AcademicSemesterYearOut)
def get_academic_semester_by_id(semester_id: int, db: Session = Depends(get_db)):
    semester = db.query(AcademicSemesterYear).filter(
        AcademicSemesterYear.id == semester_id
    ).first()
    if not semester:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Academic semester not found")
    return semester


@router.get("/get-by-year/{academic_year}", response_model=List[AcademicSemesterYearOut])
def get_academic_semesters_by_year(academic_year: str, db: Session = Depends(get_db)):
    return db.query(AcademicSemesterYear).filter(
        AcademicSemesterYear.academic_year == academic_year,
        AcademicSemesterYear.is_archive == False
    ).all()


@router.post("/create", response_model=AcademicSemesterYearOut)
def create_academic_semester(data: AcademicSemesterYearCreate, db: Session = Depends(get_db)):
    """
    Create a new academic semester.
    If current=True, all other semesters are set to current=False first.
    """
    # Check for duplicate
    existing = db.query(AcademicSemesterYear).filter(
        AcademicSemesterYear.academic_year == data.academic_year,
        AcademicSemesterYear.semester == data.semester
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{data.academic_year} - {data.semester} already exists."
        )

    # If this will be current, unset all others
    if data.current:
        db.query(AcademicSemesterYear).filter(
            AcademicSemesterYear.current == True
        ).update({"current": False})

    new_semester = AcademicSemesterYear(
        academic_year=data.academic_year,
        semester=data.semester,
        current=data.current,
        is_archive=False
    )
    db.add(new_semester)
    db.commit()
    db.refresh(new_semester)
    return new_semester


@router.patch("/set-current/{semester_id}", response_model=AcademicSemesterYearOut)
def set_current_semester(semester_id: int, db: Session = Depends(get_db)):
    """
    Set a specific semester as the current one.
    All other semesters will be set to current=False.
    """
    semester = db.query(AcademicSemesterYear).filter(
        AcademicSemesterYear.id == semester_id,
        AcademicSemesterYear.is_archive == False
    ).first()
    if not semester:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Semester not found or is archived."
        )

    # Unset all current semesters
    db.query(AcademicSemesterYear).filter(
        AcademicSemesterYear.current == True
    ).update({"current": False})

    # Set the selected one as current
    semester.current = True
    db.commit()
    db.refresh(semester)
    return semester


@router.patch("/archive/{semester_id}", response_model=AcademicSemesterYearOut)
def archive_semester(semester_id: int, db: Session = Depends(get_db)):
    """
    Archive a semester. Cannot archive the current active semester.
    """
    semester = db.query(AcademicSemesterYear).filter(
        AcademicSemesterYear.id == semester_id
    ).first()
    if not semester:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Semester not found.")
    if semester.current:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot archive the current active semester. Set another semester as current first."
        )
    semester.is_archive = True
    db.commit()
    db.refresh(semester)
    return semester