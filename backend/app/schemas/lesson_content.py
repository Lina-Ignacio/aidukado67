from pydantic import BaseModel

class LessonOut(BaseModel):
    id: int
    extracted_content: str
