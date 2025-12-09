from fastapi import APIRouter
from app.utils.tos import compute_tos
from app.schemas.exam import TOSRequest
from app.utils.generate_exam import generate_exam_from_tos

router = APIRouter(prefix="/exam", tags=["exam"])

@router.post("/compute_tos")
def generate_tos(data: TOSRequest):
    lessons_data = [lesson.dict() for lesson in data.lessons]
    result = compute_tos(lessons_data, data.total_items)
    exam_questions = generate_exam_from_tos(result)
    return {"tos": exam_questions}

@router.post("/hello")
def hello():
    print("Lina")  # still logs on server
    return {"message": "Hello from Lina!"}
