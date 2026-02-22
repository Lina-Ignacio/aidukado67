
from pydantic import BaseModel
from typing import List, Dict, Optional

class ActivityScore(BaseModel):
    activity_id: str
    title: str
    max_score: int
    activity_type: str

class StudentScore(BaseModel):
    student_id: int
    student_name: str
    scores: Dict[str, int]  # activity_id -> score

class TableHeader(BaseModel):
    key: str
    label: str
    type: str
    max_score: Optional[int] = None

class ExportScoresResponse(BaseModel):
    headers: List[TableHeader]
    max_scores_row: List
    students: List[StudentScore]
    summary: Dict[str, int]