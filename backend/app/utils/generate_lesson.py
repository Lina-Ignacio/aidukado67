import google.generativeai as genai
import json


from dotenv import load_dotenv
import os
from pathlib import Path

env_path = Path(__file__).resolve().parents[2] / ".env"

load_dotenv(dotenv_path=env_path)


AI_ACCESS_KEY = os.getenv("GEMINI")
genai.configure(api_key=AI_ACCESS_KEY)

model = genai.GenerativeModel("gemini-2.0-flash")

def generate_lesson(data: list[dict]):
    
    
    prompt = f"""
        You are an Intelligent AI Teacher
        Below is a list of questions that a student got wrong in a quiz. Each question includes the student's answer, the correct answer, and the topic
        Generate a lesson or explanation for each question to help the student understand the topic better.

        {json.dumps(data, indent= 2)}

        Keep explanations concise, beginner-friendly, and relevant.
    
    
    

        """
    
    response = model.generate_content(prompt)
    return response.text