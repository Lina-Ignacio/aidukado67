import os
import google.generativeai as genai

_model = None


def get_gemini_model():
    global _model

    if _model:
        return _model

    api_key = os.getenv("GEMINI_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_KEY missing")

    genai.configure(api_key=api_key)
    _model = genai.GenerativeModel("gemini-2.5-flash-lite")
    return _model
