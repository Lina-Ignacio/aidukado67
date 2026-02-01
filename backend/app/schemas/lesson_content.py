from pydantic import BaseModel

class LessonOut(BaseModel):
    id: int
    material_id: int
    extracted_content: str
    
