import google.generativeai as genai
from fastapi.responses import JSONResponse
from .parse_questions import parse_questions
from .get_lesson_content import get_lesson_content
from dotenv import load_dotenv
import os
from pathlib import Path

env_path = Path(__file__).resolve().parents[2] / ".env"

load_dotenv(dotenv_path=env_path)


AI_ACCESS_KEY = os.getenv("GEMINI")
genai.configure(api_key=AI_ACCESS_KEY)

model = genai.GenerativeModel("gemini-2.5-flash")

def generate_questions(lesson_id:int, num_items:int):

    content = get_lesson_content(lesson_id)

    if not content:
        return []
    

    prompt = f""" 

        you are a exam generator 

        Using the lesson content below, generate {num_items} multiple-choice questions.
        Each question must have 4 options (A, B, C, D) and include the correct answer.
        
        Content:
        \"\"\"{content}\"\"\"
        
        Format Your Response like these:
        
        1. Question ...
        
            A. Option
            B. Option
            C. Option
            D. Option
            
        Answer: B
        
        Begin: 
        
    """
    
    response = model.generate_content(prompt)
    raw_questions =  response.text
    parsed_questions = parse_questions(raw_questions)
    
    return parsed_questions
    
def generate_exam_from_tos(tos_array: list[dict]):
    """
    tos_array = [
        {"lesson_id": 1, "title": "Lesson 1", "hours": 2},
        {"lesson_id": 2, "title": "Lesson 2", "hours": 4},
    ]
    """

    final_questions = []
    
    for row in tos_array:
        lesson_id = row["lesson_id"]
        num_items = row["items"]

        questions = generate_questions(lesson_id, num_items)

        # Add lesson id to each question
        #for q in questions:
            #q["lesson_id"] = lesson_id

        final_questions.extend(questions)

    for i, q in enumerate(final_questions, start=1):
        q["number"] = i

    return final_questions 