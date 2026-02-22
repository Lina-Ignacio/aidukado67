import google.generativeai as genai
import os

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

class GeminiModel:
    def __init__(self, model_name="gemini-1.5-flash"):
        self.model_name = model_name
        self.model = genai.GenerativeModel(model_name)
    
    async def generate_content_async(self, prompt: str) -> str:
        """Generate content using Gemini"""
        response = self.model.generate_content(prompt)
        return response

def get_gemini_model():
    """Get Gemini model instance"""
    # Try different model names
    try:
        return GeminiModel("gemini-1.5-flash")
    except:
        try:
            return GeminiModel("gemini-1.5-pro")
        except:
            return GeminiModel("gemini-1.0-pro")