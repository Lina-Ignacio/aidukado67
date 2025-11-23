from pydantic import BaseModel

class CreateSummary(BaseModel):
    lesson_id:int
    summary:str

class SummaryOut(BaseModel):
    lesson_id:int
    summary:str
