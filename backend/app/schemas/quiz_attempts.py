from pydantic import BaseModel
from datetime import datetime

class CreateStartTime(BaseModel):
    quiz_id: int
    student_id:int