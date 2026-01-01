
from fastapi.responses import JSONResponse
from .parse_questions import parse_questions
from dotenv import load_dotenv
from pathlib import Path
from app.core.gemini import get_gemini_model


def generate_pretest(lesson_content, num_items, question_type):
    
    model = get_gemini_model()
    
    prompt = f"""
        Based on the content below, generate a {num_items}-question {question_type} quiz. 

        Content:
        \"\"\"{lesson_content}\"\"\"

        Important rules:
        - You must ALWAYS provide a correct answer for every question.
        - Never return an "N/A" as a answer.
        - If the content is unclear, infer the most reasonable correct answer instead of outputting N/A.
        - Every question must be answerable.

        Format your response like this (for multiple choice):

        1. Question ...

            A. Option
            B. Option
            C. Option
            D. Option

        Answer: B

        If the question type is True/False, format like this:

        1. Question ...

            A. True
            B. False

        Answer: True

        Begin:
        """
    
    response = model.generate_content(prompt)
    raw_questions =  response.text
    parsed_questions = parse_questions(raw_questions)
    
    return parsed_questions
    