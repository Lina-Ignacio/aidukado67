from pydantic import BaseModel, ConfigDict
from typing import Optional, List


class AcademicSemesterYearBase(BaseModel):
    academic_year: str
    semester: str
    current: bool = False
    is_archive: bool = False


class AcademicSemesterYearCreate(AcademicSemesterYearBase):
    pass


class AcademicSemesterYearUpdate(BaseModel):
    academic_year: Optional[str] = None
    semester: Optional[str] = None
    current: Optional[bool] = None
    is_archive: Optional[bool] = None


class AcademicSemesterYearOut(AcademicSemesterYearBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)


class SetCurrentSemester(BaseModel):
    id: int


class BulkAcademicSemesterResponse(BaseModel):
    created: int
    skipped: int
    errors: List[str] = []