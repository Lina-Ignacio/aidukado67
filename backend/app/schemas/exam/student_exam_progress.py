
from pydantic import BaseModel
from typing import Dict, Optional, Any
from datetime import datetime

class StartExamRequest(BaseModel):
    exam_id: int
    student_id: int

class SubmitExamScore(BaseModel):
    student_id: int
    exam_id: int
    status: str
    score: float
    answers: Optional[Dict[str, Any]] = None  
    
class StudentExamProgressOut(BaseModel):
    id: int
    student_id: int
    exam_id: int
    status: str
    score: Optional[float] = None
    answers: Optional[Dict[str, Any]] = None
    start_time: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        
class StartExamResponse(BaseModel):
    start_time: datetime
    status: str
    score: Optional[float] = None
    answers: Optional[Dict[str, Any]] = None