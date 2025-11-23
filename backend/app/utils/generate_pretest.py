import google.generativeai as genai
from fastapi.responses import JSONResponse
from .parse_questions import parse_questions
from dotenv import load_dotenv
import os
from pathlib import Path

env_path = Path(__file__).resolve().parents[2] / ".env"
print(f"🔍 Looking for .env at: {env_path}")
print(f"📁 .env exists: {env_path.exists()}")

load_dotenv(dotenv_path=env_path)

AI_ACCESS_KEY = os.getenv("GEMINI")

print(f"🔑 API Key loaded: {bool(AI_ACCESS_KEY)}")
if AI_ACCESS_KEY:
    print(f"🔑 API Key preview: {AI_ACCESS_KEY[:10]}...{AI_ACCESS_KEY[-4:]}")

if not AI_ACCESS_KEY:
    raise ValueError("❌ GEMINI_KEY not found. Check your .env location or name.")

genai.configure(api_key=AI_ACCESS_KEY)
model = genai.GenerativeModel("gemini-2.0-flash")

def generate_pretest(lesson_content, num_items, question_type):
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
    