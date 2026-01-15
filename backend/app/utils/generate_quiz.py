import asyncio
from fastapi.responses import JSONResponse
from .parse_questions import parse_questions
from dotenv import load_dotenv
from pathlib import Path
from app.core.gemini import get_gemini_model

async def generate_quiz(lesson_content, num_items, question_type):
    """
    Generates a quiz using Gemini with strict enforcement of valid answers.
    """
    model = get_gemini_model()
    
    # 1. Map question_type to user-friendly format
    type_map = {
        "multiple_choice": "multiple choice",
        "true_false": "True/False"
    }
    formatted_type = type_map.get(question_type, question_type)
    
    # 2. Define the format example based on type
    if question_type == "true_false":
        format_example = """
1. Question text here?
Answer: True

2. Another question text here?
Answer: False
"""
    else:  # multiple_choice
        format_example = """
1. Question text here?
    A. Option text
    B. Option text
    C. Option text
    D. Option text
Answer: B
"""

    # 3. The Optimized Prompt
    # We use a "System Role" and explicit fallback instructions to prevent "N/A"
    prompt = f"""
ROLE: You are an expert Assessment Specialist and Educator.

TASK: Generate a high-quality quiz based on the provided content. 
You must produce exactly {num_items} questions in {formatted_type} format.

CONTENT:
\"\"\"{lesson_content}\"\"\"

STRICT COMPLIANCE RULES:
- MANDATORY ANSWERS: Every question must include a correct answer.
- NO NULL ENTRIES: Under no circumstances will you return "N/A", "None", "Unknown", or "Not provided" as an answer.
- INTELLIGENT INFERENCE: If the content is slightly ambiguous, use your internal knowledge base to determine the most factual and logical correct answer.
- QUESTION QUALITY: Ensure questions are pedagogical and directly related to the key concepts of the content.
- OUTPUT ONLY: Return only the questions and answers. Do not include introductory text like "Sure, here is your quiz."

FORMAT YOUR RESPONSE EXACTLY LIKE THIS EXAMPLE:
{format_example}

BEGIN GENERATING {num_items} QUESTIONS:
"""

    try:
        # 4. Generate Content
        response = await model.generate_content_async(prompt)
        raw_questions = response.text
        
        if not raw_questions:
            print("Error: Gemini returned an empty response.")
            return []

        # 5. Parse the raw text into Python objects
        parsed_questions = parse_questions(raw_questions)
        
        # 6. Validation Logic
        if len(parsed_questions) != int(num_items):
            print(f"Warning: Requested {num_items} questions, but AI generated {len(parsed_questions)}.")
            
        # Optional: Final check for N/A in the parsed results
        for q in parsed_questions:
            if str(q.get("answer")).upper() in ["N/A", "NONE", "NULL"]:
                # Force a fallback or log a specific error
                print(f"Detected invalid answer in question: {q.get('question')}")

        return parsed_questions
    
    except Exception as e:
        print(f"Error generating quiz: {str(e)}")
        # You might want to return an empty list or re-raise depending on your API needs
        raise