from pydantic import BaseModel
from typing import Dict, Optional
from datetime import datetime


class StartTimeRequest(BaseModel):
    quiz_id: int
    student_id: int


class CreateScore(BaseModel):
    student_id: int
    quiz_id: int
    status: str
    score: float
    answers: Dict[str, str] 

class ScoreOut(BaseModel):
    id: int
    student_id: int
    quiz_id: int
    status: str
    score: float
    answers: Dict[str, str]
    start_time: datetime 

    class Config:
        from_attributes = True 
        
class StartTimeResponse(BaseModel):
    start_time: datetime
    status: str
    score: Optional[int] = None
    answers: Optional[Dict[str, str]] = None