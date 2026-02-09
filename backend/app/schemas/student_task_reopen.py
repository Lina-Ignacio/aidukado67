# app/schemas/task_reopen.py
from pydantic import BaseModel, field_validator
from typing import List, Optional
from datetime import datetime, timezone

class EligibleStudentResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    full_name: str
    status: str  # "no_submission" or "late_submission"
    submission_status: str
    
    class Config:
        from_attributes = True

class ReopenTaskRequest(BaseModel):
    student_ids: List[int]
    new_due_date: datetime
    reason: Optional[str] = None
    
    @field_validator('new_due_date')
    @classmethod
    def ensure_utc_timezone(cls, v: datetime) -> datetime:
        """
        Ensure the datetime has UTC timezone.
        """
        if v.tzinfo is None:
            # Naive datetime - assume UTC
            return v.replace(tzinfo=timezone.utc)
        else:
            # Aware datetime - convert to UTC
            return v.astimezone(timezone.utc)
    
    @field_validator('reason')
    @classmethod
    def validate_reason_length(cls, v):
        if v and len(v) > 500:
            raise ValueError('Reason cannot exceed 500 characters')
        return v

class ReopenTaskResponse(BaseModel):
    message: str
    created_count: int
    new_due_date: str
    reason: Optional[str]