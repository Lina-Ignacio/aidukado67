from pydantic import BaseModel
from typing import Any, List
from datetime import datetime

from pydantic import BaseModel
from typing import Any, List, Optional
from datetime import datetime

class CreateQuiz(BaseModel):
    lesson_id: int
    title: str
    total_points: int
    instructions: str
    quiz_content: Any
    duration: int
    class_id: int
    is_archive: bool
    assessment_type: str
    term_id: int
    assigned_students: Optional[List[int]] = []
    opening_time: Optional[datetime] = None  
    closing_time: Optional[datetime] = None  


class QuizOut(BaseModel):
    id: int
    lesson_id: int
    title: str
    total_points: int
    instructions: str
    quiz_content: Any
    duration: int
    created_at: datetime
    class_id: int
    is_archive:bool
    assessment_type:str
    term_id:int
    opening_time: Optional[datetime] = None  
    closing_time: Optional[datetime] = None  
       
class QuizOutSimple(BaseModel):
    id: int
    title: str
    total_points: int
    duration: int
    created_at: datetime
    assessment_type:str
    status: str
    score: Optional[int] = None
    closing_time: Optional[datetime] = None  
    opening_time: Optional[datetime] = None  
    
class AddStudentsRequest(BaseModel):
    quiz_id: int
    student_ids: List[int]
    
class QuizMonitoringStudent(BaseModel):
    studentId: int
    studentName: str
    score: Optional[int] = None
    status: str  # "completed", "submitted", "started", "assigned", "not_assigned"
    submissionStatus: str  # More descriptive status
    startTime: Optional[datetime] = None
    hasAnswers: bool = False
    
    class Config:
        from_attributes = True

class QuizMonitoringResponse(BaseModel):
    quizTitle: str
    lessonTitle: str
    totalPoints: int
    closingTime: Optional[datetime] = None
    openingTime: Optional[datetime] = None
    scores: List[QuizMonitoringStudent]