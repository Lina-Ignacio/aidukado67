from pydantic import BaseModel
from typing import List

class LessonHour(BaseModel):
    lesson_id: int
    title: str
    hours: float

class TOSRequest(BaseModel):
    lessons: List[LessonHour]
    total_items: int