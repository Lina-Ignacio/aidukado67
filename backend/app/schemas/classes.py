from pydantic import BaseModel, ConfigDict, validator, field_validator
from typing import Optional, List
from app.utils.to_camel import to_camel   
from app.schemas.user import TeacherOut
from app.schemas.subject import SubjectOut
import re 

class ClassCreate(BaseModel):
    subject_id: int
    teacher_id: int
    schedule: str
    room: Optional[str] = None
    section: Optional[str] = None
    lecture_units: int = 0  
    lab_units: int = 0      

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True
    )


class ClassUpdate(BaseModel):
    subject_id: Optional[int] = None
    teacher_id: Optional[int] = None
    name: Optional[str] = None
    schedule: Optional[str] = None
    room: Optional[str] = None
    section: Optional[str] = None
    # academic_year: Optional[str] = None
    # semester: Optional[str] = None
    lecture_units: Optional[int] = None  
    lab_units: Optional[int] = None      

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True
    )


class ClassOut(BaseModel):
    id: int
    name: str
    subject: SubjectOut
    user_teacher: TeacherOut
    schedule: str
    room: Optional[str] = None
    section: Optional[str] = None
    academic_semester_id: Optional[int] = None
    lecture_units: int = 0  
    lab_units: int = 0      

    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True
    )
    
class ClassWithTeacherOut(BaseModel):
    id: int
    name: str
    schedule: str
    room: Optional[str] = None
    section: Optional[str] = None
    user_teacher: TeacherOut
    
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True
    )
        


class ClassCSVRow(BaseModel):
    course_code: str          # Maps to Classes.name
    section: str
    room: str
    schedule: str
    lecture_units: int = 0
    lab_units: int = 0
    teacher_email: str        # Used to find Users

    @field_validator('course_code')
    def validate_course_code(cls, v):
        if not v or v.strip() == "":
            raise ValueError('Course code is required')
        if len(v.strip()) > 50:
            raise ValueError('Course code cannot exceed 50 characters')
        return v.strip()

    @field_validator('section')
    def validate_section(cls, v):
        if not v or v.strip() == "":
            raise ValueError('Section is required')
        if len(v.strip()) > 10:
            raise ValueError('Section cannot exceed 10 characters')
        return v.strip()

    @field_validator('room')
    def validate_room(cls, v):
        if not v or v.strip() == "":
            raise ValueError('Room is required')
        if len(v.strip()) > 50:
            raise ValueError('Room cannot exceed 50 characters')
        return v.strip()

    @field_validator('schedule')
    def validate_schedule(cls, v):
        if not v or v.strip() == "":
            raise ValueError('Schedule is required')
        if ':' not in v:
            raise ValueError('Schedule must contain ":" (e.g., "MW: 9:00am-12:00pm")')
        return v.strip()

    @field_validator('lecture_units', 'lab_units')
    def validate_units(cls, v):
        if not isinstance(v, int) or v < 0 or v > 10:
            raise ValueError('Units must be between 0 and 10')
        return v

    @field_validator('teacher_email')
    def validate_teacher_email(cls, v):
        if not v or v.strip() == "":
            raise ValueError('Teacher email is required')
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', v):
            raise ValueError('Invalid email format')
        return v.strip()

    @field_validator('lecture_units', 'lab_units', mode='before')
    def validate_at_least_one_unit(cls, v, info):
        # This will be handled in the endpoint logic
        return v

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True
    )


class BulkClassUpload(BaseModel):
    classes: List[ClassCSVRow]

    @field_validator('classes')
    def validate_classes_not_empty(cls, v):
        if not v:
            raise ValueError('No classes provided for upload')
        return v


class BulkUploadResponse(BaseModel):
    created: int
    skipped: int
    errors: List[str] = []
    
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True
    )