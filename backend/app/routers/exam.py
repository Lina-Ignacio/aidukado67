from fastapi import APIRouter
from app.utils.tos import compute_tos
from app.schemas.exam import TOSRequest

router = APIRouter(prefix="/exam", tags=["exam"])

@router.post("/compute_tos")
def generate_tos(data: TOSRequest):
    lessons_data = [lesson.dict() for lesson in data.lessons]
    result = compute_tos(lessons_data, data.total_items)
    return {"tos": result}