# app/schemas/quiz_reopen.py
from pydantic import BaseModel, field_validator
from typing import List, Optional
from datetime import datetime, timezone

class QuizEligibleStudentResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    full_name: str
    status: str  # "no_submission" or "late_submission"
    submission_status: str
    
    class Config:
        from_attributes = True

class QuizReopenRequest(BaseModel):
    student_ids: List[int]
    new_closing_time: datetime  # Changed from new_due_date to new_closing_time
    reason: Optional[str] = None
    
    @field_validator('new_closing_time')
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

class QuizReopenResponse(BaseModel):
    message: str
    created_count: int
    new_closing_time: str  # Changed from new_due_date
    reason: Optional[str]