import google.generativeai as genai
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from pathlib import Path
from app.core.gemini import get_gemini_model



def generate_summary(lesson_content):
    
    model = get_gemini_model()
    
    """
    Generate a concise and informative summary of the given lesson content.
    """
    prompt = f"""
        Summarize the following lesson clearly and concisely.
        Focus on the key ideas, important terms, and main points of understanding.
        Avoid repetition or unnecessary details.

        Lesson content:
        \"\"\"{lesson_content}\"\"\"

        Format:
        Summary:
        - [Your summary here in bullet form]
    """

    response = model.generate_content(prompt)
    summary = response.text
    return summary