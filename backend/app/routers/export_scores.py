

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, aliased
from sqlalchemy import func, select, case, or_, and_, literal, literal_column
from typing import List, Dict
from app.models import (
    Users, ClassEnrollment, ClassMaterial, 
    StudentSubmission, Quiz, StudentQuizProgress,
    Exam, StudentExamProgress
)
from app.schemas.export_scores import ExportScoresResponse
from fastapi.responses import Response
import csv
import io
from app.database import get_db

router = APIRouter(prefix="/score", tags=["Score Export"])


@router.get("/export-scores/{class_id}/{term_id}")
async def export_scores(
    class_id: int,
    term_id: int,
    db: Session = Depends(get_db)
):
    # STEP 1: Get all enrolled students
    enrolled_students = db.query(
        Users.id.label("student_id"),
        func.concat(Users.first_name, ' ', Users.last_name).label("student_name")
    ).join(
        ClassEnrollment, Users.id == ClassEnrollment.student_id
    ).filter(
        ClassEnrollment.class_id == class_id,
        ClassEnrollment.is_archive == False,
        Users.is_archive == False,
        Users.role == "student"
    ).order_by(
        Users.last_name,
        Users.first_name
    ).all()
    
    if not enrolled_students:
        raise HTTPException(status_code=404, detail="No students found in this class")
    
    # STEP 2: Get all activities
    
    # 2A: Get materials (excluding lessons) - FIXED
    materials = db.query(
        ClassMaterial.id,
        ClassMaterial.title,
        func.coalesce(ClassMaterial.total_score, 0).label("max_score"),
        literal("material").label("activity_type")  # Changed from func.literal()
    ).filter(
        ClassMaterial.class_id == class_id,
        ClassMaterial.term_id == term_id,
        ClassMaterial.type != "lesson",
        ClassMaterial.is_archive == False
    ).order_by(
        ClassMaterial.created_at
    ).all()
    
    # 2B: Get quizzes - FIXED
    quizzes = db.query(
        Quiz.id,
        Quiz.title,
        func.coalesce(Quiz.total_points, 0).label("max_score"),
        literal("quiz").label("activity_type")  # Changed from func.literal()
    ).filter(
        Quiz.class_id == class_id,
        Quiz.term_id == term_id,
        Quiz.is_archive == False
    ).order_by(
        Quiz.created_at
    ).all()
    
    # 2C: Get exams - FIXED
    exams = db.query(
        Exam.id,
        Exam.title,
        func.coalesce(Exam.total_points, 0).label("max_score"),
        literal("exam").label("activity_type")  # Changed from func.literal()
    ).filter(
        Exam.class_id == class_id,
        Exam.term_id == term_id,
        Exam.is_archive == False
    ).order_by(
        Exam.created_at
    ).all()
    
    # Combine all activities
    all_activities = []
    
    # Process materials
    for material in materials:
        all_activities.append({
            "id": f"material_{material.id}",
            "title": material.title,
            "max_score": material.max_score,
            "type": "material"
        })
    
    # Process quizzes
    for quiz in quizzes:
        all_activities.append({
            "id": f"quiz_{quiz.id}",
            "title": quiz.title,
            "max_score": quiz.max_score,
            "type": "quiz"
        })
    
    # Process exams
    for exam in exams:
        all_activities.append({
            "id": f"exam_{exam.id}",
            "title": exam.title,
            "max_score": exam.max_score,
            "type": "exam"
        })
    
    if not all_activities:
        raise HTTPException(status_code=404, detail="No activities found for this class/term")
    
    # STEP 3: Get all scores
    
    # Create a mapping of student_id -> student data
    scores_data = {}
    for student in enrolled_students:
        scores_data[student.student_id] = {
            "student_name": student.student_name,
            "scores": {}
        }
    
    # 3A: Get material submissions scores - FIXED concat
    material_scores = db.query(
        StudentSubmission.student_id,
        func.concat('material_', StudentSubmission.material_id).label("activity_id"),
        func.coalesce(StudentSubmission.score, 0).label("score")
    ).join(
        ClassMaterial, StudentSubmission.material_id == ClassMaterial.id
    ).filter(
        ClassMaterial.class_id == class_id,
        ClassMaterial.term_id == term_id,
        ClassMaterial.type != "lesson",
        ClassMaterial.is_archive == False
    ).all()
    
    # 3B: Get quiz progress scores - FIXED concat
    quiz_scores = db.query(
        StudentQuizProgress.student_id,
        func.concat('quiz_', StudentQuizProgress.quiz_id).label("activity_id"),
        func.coalesce(StudentQuizProgress.score, 0).label("score")
    ).join(
        Quiz, StudentQuizProgress.quiz_id == Quiz.id
    ).filter(
        Quiz.class_id == class_id,
        Quiz.term_id == term_id,
        Quiz.is_archive == False
    ).all()
    
    # 3C: Get exam progress scores - FIXED concat
    exam_scores = db.query(
        StudentExamProgress.student_id,
        func.concat('exam_', StudentExamProgress.exam_id).label("activity_id"),
        func.coalesce(StudentExamProgress.score, 0).label("score")
    ).join(
        Exam, StudentExamProgress.exam_id == Exam.id
    ).filter(
        Exam.class_id == class_id,
        Exam.term_id == term_id,
        Exam.is_archive == False
    ).all()
    
    # Combine all scores
    all_scores = list(material_scores) + list(quiz_scores) + list(exam_scores)
    
    # Populate scores data
    for score_record in all_scores:
        student_id = score_record.student_id
        activity_id = score_record.activity_id
        score = score_record.score
        
        if student_id in scores_data:
            scores_data[student_id]["scores"][activity_id] = score
    
    # STEP 4: Format the response
    headers = [{"key": "student_name", "label": "Student Name", "type": "header"}]
    
    for activity in all_activities:
        headers.append({
            "key": activity["id"],
            "label": activity["title"],
            "type": "activity",
            "max_score": activity["max_score"]
        })
    
    # Create max scores row
    max_scores_row = ["Highest Possible Score"]
    for activity in all_activities:
        max_scores_row.append(activity["max_score"])
    
    # Create students list
    students_list = []
    for student_id, student_data in scores_data.items():
        student_scores = {}
        
        # Initialize all activities with 0 score
        for activity in all_activities:
            activity_id = activity["id"]
            student_scores[activity_id] = student_data["scores"].get(activity_id, 0)
        
        students_list.append({
            "student_id": student_id,
            "student_name": student_data["student_name"],
            "scores": student_scores
        })
    
    # Create summary
    summary = {
        "total_activities": len(all_activities),
        "total_students": len(students_list),
        "class_id": class_id,
        "term_id": term_id
    }
    
    return {
        "headers": headers,
        "max_scores_row": max_scores_row,
        "students": students_list,
        "summary": summary
    }


@router.get("/export-scores/{class_id}/{term_id}/csv")
async def export_scores_csv(
    class_id: int,
    term_id: int,
    db: Session = Depends(get_db)
):
    """
    Export scores as CSV file
    """
    # Get the data using our main endpoint
    scores_data = await export_scores(class_id, term_id, db)
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write headers
    header_row = [header["label"] for header in scores_data["headers"]]
    writer.writerow(header_row)
    
    # Write max scores row
    writer.writerow(scores_data["max_scores_row"])
    
    # Write student rows
    for student in scores_data["students"]:
        row = [student["student_name"]]
        for header in scores_data["headers"][1:]:  # Skip student_name header
            activity_id = header["key"]
            score = student["scores"].get(activity_id, 0)
            row.append(score)
        writer.writerow(row)
    
    # Return CSV file
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=scores_class_{class_id}_term_{term_id}.csv"
        }
    )