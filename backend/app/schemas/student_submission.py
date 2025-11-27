from pydantic import BaseModel, ConfigDict
from app.utils.to_camel import to_camel
from typing import Optional
from datetime import datetime




class SubmissionCreate(BaseModel):
    material_id: int
    student_id: int
    status: str = "submitted"  

    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True
    )


class SubmissionUpdate(BaseModel):
    score: Optional[int] = None
    remarks: Optional[str] = None
    status: Optional[str] = None  

    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True
    )


class SubmissionOut(BaseModel):
    id: int
    material_id: int
    student_id: int
    file_path: str
    submitted_at: datetime
    score: Optional[int]
    remarks: Optional[str]
    status: str

    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True
    )
    
class SubmissionStudent(BaseModel):
    id: int
    first_name: Optional[str]
    last_name: Optional[str]
    middle_name: Optional[str]

    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True
    )
    
class SubmissionListOut(BaseModel):
    id: int
    material_id: int
    student_id: int
    score: Optional[int]
    remarks: Optional[str]
    student: SubmissionStudent

    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True
    )
    
class SubmissionWithStudentOut(SubmissionListOut):   
    student: SubmissionStudent                   

    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True
    )