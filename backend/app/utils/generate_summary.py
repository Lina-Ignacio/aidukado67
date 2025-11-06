import google.generativeai as genai
from fastapi.responses import JSONResponse
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

genai.configure(
    api_key=AI_ACCESS_KEY,
    client_options={"api_endpoint": "https://generativelanguage.googleapis.com"}
)

# genai.configure(api_key=AI_ACCESS_KEY)

model = genai.GenerativeModel("gemini-1.5-flash")

def generate_summary(lesson_content):
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