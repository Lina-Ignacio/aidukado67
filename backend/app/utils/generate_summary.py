import google.generativeai as genai
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from pathlib import Path
# from app.core.gemini import get_gemini_model

from app.core.summary_groq import get_summary_model
import json
import datetime
import re
from typing import Dict, Any

def clean_json_text(text: str) -> str:
    """Clean and fix common JSON formatting issues from AI responses"""
    
    # 1. Remove everything before first { and after last }
    start = text.find('{')
    end = text.rfind('}')
    
    if start == -1 or end == -1:
        raise ValueError("No JSON object found in response")
    
    text = text[start:end+1]
    
    # 2. Fix trailing commas in arrays and objects
    text = re.sub(r',\s*}', '}', text)  # Remove trailing commas before }
    text = re.sub(r',\s*]', ']', text)  # Remove trailing commas before ]
    
    # 3. Fix unescaped quotes in strings
    lines = text.split('\n')
    cleaned_lines = []
    
    for line in lines:
        # Count quotes in the line
        quote_count = line.count('"')
        
        # If odd number of quotes, there might be unescaped ones
        if quote_count % 2 == 1:
            # Try to fix common issues
            line = line.replace('"', '\"')  # Escape all quotes
        
        cleaned_lines.append(line)
    
    text = '\n'.join(cleaned_lines)
    
    # 4. Fix missing commas between object items
    # Look for patterns like: "key": value}\n{
    text = re.sub(r'}\s*{', '},{', text)
    
    # 5. Remove any markdown formatting
    text = text.replace('```json', '').replace('```', '')
    
    # 6. Fix common AI mistakes
    text = text.replace('True', 'true').replace('False', 'false').replace('None', 'null')
    
    return text.strip()

async def generate_summary(lesson_content: str) -> Dict[str, Any]:
    """
    Generate an ultra-concise summary designed for quick review.
    Condenses lengthy content into a 5-10 minute read.
    """
    model = get_summary_model()
    
    prompt = f"""
    You are an expert educator creating study summaries. Create a JSON summary using EXACTLY this format:

    {{
        "title": "Very short title (3-5 words)",
        "executiveSummary": "One sentence summary",
        "mustKnow": [
            "Critical concept 1",
            "Critical concept 2", 
            "Critical concept 3"
        ],
        "keyTakeaways": [
            "Takeaway 1",
            "Takeaway 2",
            "Takeaway 3",
            "Takeaway 4",
            "Takeaway 5"
        ],
        "essentialTerms": {{
            "Term1": "Definition 1",
            "Term2": "Definition 2",
            "Term3": "Definition 3"
        }},
        "practicalApplications": [
            "Application 1",
            "Application 2",
            "Application 3"
        ],
        "commonTraps": [
            "Trap 1",
            "Trap 2"
        ],
        "memoryHooks": [
            "Hook 1",
            "Hook 2"
        ],
        "ifYouRememberOneThing": "Most important point",
        "nextAction": "Specific action"
    }}

    CONTENT:
    {lesson_content[:3000]}

    IMPORTANT: 
    1. Return ONLY the JSON object
    2. No markdown formatting
    3. No extra text before or after
    4. Ensure all quotes are properly escaped
    5. Use valid JSON syntax
    """
    
    try:
        response_text = await model.generate(
            prompt,
            temperature=0.3,
            max_tokens=1000
        )
        
        print(f"[DEBUG] Raw response (first 500 chars): {response_text[:500]}...")
        
        # Try to parse directly first
        try:
            data = json.loads(response_text.strip())
        except json.JSONDecodeError as e:
            print(f"[DEBUG] First parse failed: {e}")
            print(f"[DEBUG] Attempting to clean JSON...")
            
            # Clean the JSON
            cleaned_text = clean_json_text(response_text)
            print(f"[DEBUG] Cleaned text (first 500 chars): {cleaned_text[:500]}...")
            
            try:
                data = json.loads(cleaned_text)
            except json.JSONDecodeError as e2:
                print(f"[DEBUG] Cleaned parse also failed: {e2}")
                
                # Last resort: try to extract just the valid parts
                try:
                    # Find all {...} patterns and try each
                    json_patterns = re.findall(r'\{[^{}]*\}', cleaned_text)
                    for pattern in json_patterns:
                        try:
                            data = json.loads(pattern)
                            print(f"[DEBUG] Successfully parsed a subset")
                            break
                        except:
                            continue
                    else:
                        raise ValueError("Could not extract valid JSON")
                except:
                    return {
                        "error": "Failed to parse AI response as JSON",
                        "fallback": "The summary generator encountered a formatting error",
                        "debug": {
                            "error_position": str(e2),
                            "text_sample": response_text[:200]
                        }
                    }
        
        # Add metadata
        data["summaryMetadata"] = {
            "generatedAt": datetime.datetime.now().isoformat(),
            "estimatedReadTime": "10-15 minutes",
            "model": "summary-optimized"  
        }
        
        return data
        
    except Exception as e:
        print(f"Error: {e}")
        return {
            "error": "Summary generation failed",
            "details": str(e)
        }