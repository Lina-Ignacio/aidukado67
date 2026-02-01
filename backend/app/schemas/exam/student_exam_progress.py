
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
        
class StudentExamWithDetails(BaseModel):
    # Student progress fields
    id: int
    student_id: int
    exam_id: int
    status: str
    score: Optional[float] = None
    answers: Optional[Dict[str, Any]] = None
    start_time: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Exam details
    title: str
    total_points: int
    duration: int
    instructions: Optional[str] = None
    passing_score: Optional[int] = None
       
    
    class Config:
        from_attributes = True
        
class StartExamResponse(BaseModel):
    start_time: datetime
    status: str
    score: Optional[float] = None
    answers: Optional[Dict[str, Any]] = None
    

class ExamStartRequest(BaseModel):
    exam_id: int
    student_id: int

class ExamStartResponse(BaseModel):
    id: int
    student_id: int
    exam_id: int
    status: str  # "assigned", "in_progress", "submitted"
    score: Optional[float] = None
    answers: Optional[Dict[str, Any]] = None
    flagged_questions: Optional[Dict[str, Any]] = None
    start_time: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    time_spent: Optional[int] = None  # in seconds
    

class StudentExamProgressBase(BaseModel):
    student_id: int
    exam_id: int
    status: str = "assigned"
    score: Optional[float] = None
    answers: Optional[Dict[str, Any]] = None
    flagged_questions: Optional[Dict[str, Any]] = None
    start_time: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    time_spent: Optional[int] = None
    

class ExamStartRequest(BaseModel):
    exam_id: int
    student_id: int

class ExamSubmission(BaseModel):
    student_id: int
    exam_id: int
    score: Optional[int] = None
    answers: Dict[str, Any] = {}  

class ExamProgressSave(BaseModel):
    student_id: int
    exam_id: int
    answers: Dict[str, Any] = {}  