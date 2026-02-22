from pydantic import BaseModel, field_validator
from typing import List, Optional
from datetime import datetime, timezone

class EligibleStudentResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    full_name: str
    status: str
    
    class Config:
        from_attributes = True

class ReopenExamRequest(BaseModel):
    student_ids: List[int]
    new_closing_time: datetime
    
    @field_validator('new_closing_time')
    @classmethod
    def ensure_utc_timezone(cls, v: datetime) -> datetime:
        """
        Ensure the datetime has UTC timezone.
        If it's naive (no timezone), assume UTC.
        If it has a timezone, convert to UTC.
        """
        if v.tzinfo is None:
            # Naive datetime 
            return v.replace(tzinfo=timezone.utc)
        else:
            # Aware datetime 
            return v.astimezone(timezone.utc)

class ReopenExamResponse(BaseModel):
    message: str
    created_count: int
    skipped_count: int
    errors: Optional[List[str]]
    new_closing_time: str