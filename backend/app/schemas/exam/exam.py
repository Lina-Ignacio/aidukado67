
from pydantic import BaseModel
from typing import List, Any, Optional, Dict
from datetime import datetime

class LessonHour(BaseModel):
    lesson_id: int
    title: str
    hours: float

class TOSRequest(BaseModel):
    lessons: List[LessonHour]
    total_items: int
    
    
class CreateExam(BaseModel):
    title: str
    total_points: int
    instructions: str
    exam_content: Any  
    duration: int
    class_id: int
    term_id: int
    is_archive: bool = False
    passing_score: Optional[int] = None
    shuffle_questions: bool = False
    assigned_students: Optional[List[int]] = []
    class_material_ids: Optional[List[int]] = []
    lesson_ids: List[int] = []
    
class ExamOut(BaseModel):
    id: int
    title: str
    total_points: int
    instructions: str
    exam_content: Any
    duration: int
    class_id: int
    term_id: int
    is_archive: bool
    passing_score: Optional[int] = None
    shuffle_questions: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        
class AddStudentsToExam(BaseModel):
    exam_id: int
    student_ids: List[int]

# New schemas for update, archive, and restore
class ExamUpdate(BaseModel):
    title: Optional[str] = None
    total_points: Optional[int] = None
    instructions: Optional[str] = None
    exam_content: Optional[Any] = None
    duration: Optional[int] = None
    passing_score: Optional[int] = None
    shuffle_questions: Optional[bool] = None
    is_archive: Optional[bool] = None
    class_material_ids: Optional[List[int]] = None

class ArchiveExam(BaseModel):
    is_archive: bool = True

class ExamListResponse(BaseModel):
    exams: List[ExamOut]
    total: int

class SimpleExamResponse(BaseModel):
    """Simplified response for frontend display"""
    id: int
    title: str
    total_points: int
    instructions: str
    duration: int
    passing_score: Optional[int] = None
    shuffle_questions: bool
    created_at: datetime
    
    class Config:
        from_attributes = True