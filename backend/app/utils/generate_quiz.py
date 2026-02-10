import asyncio
from .parse_questions import parse_questions
from app.core.gemini import get_gemini_model
from app.core.quiz_groq_optimized import get_quiz_generator

async def generate_quiz(lesson_content, num_items, question_type):
    """
    Smart quiz generation with context window awareness
    """
    # Get the smart generator
    generator = get_quiz_generator()
    
    num_items_int = int(num_items)
    
    print(f"\n" + "="*50)
    print(f"🧠 QUIZ GENERATION STARTED")
    print(f"📋 Type: {num_items_int} {question_type} questions")
    print(f"📊 Model: {generator.current_model}")
    print(f"📐 Context window: {generator.model_config.context_window:,} tokens")
    print("="*50)
    
    # Get status
    status = generator.get_status()
    print(f"🔑 Keys: {status['keys_available']}/{status['keys_total']} available")
    
    # SMART truncation based on model context window
    if "compound" in generator.current_model:
        # Compound models: 8192 context window
        if num_items_int <= 5:
            max_lesson_length = 6000
        elif num_items_int <= 10:
            max_lesson_length = 4000
        elif num_items_int <= 15:
            max_lesson_length = 2500
        elif num_items_int <= 20:
            max_lesson_length = 1500
        else:
            max_lesson_length = 1000  # Very short for 20+ questions
    else:
        # Llama models: 32768 context window
        if num_items_int <= 10:
            max_lesson_length = 10000
        elif num_items_int <= 20:
            max_lesson_length = 6000
        else:
            max_lesson_length = 3000
    
    if len(lesson_content) > max_lesson_length:
        print(f"📝 Truncating lesson from {len(lesson_content):,} to {max_lesson_length:,} chars")
        lesson_content = lesson_content[:max_lesson_length] + "..."
    else:
        print(f"📝 Lesson length: {len(lesson_content):,} chars (OK)")
    
    # Your prompt
    type_map = {
        "multiple_choice": "multiple choice",
        "true_false": "True/False"
    }
    formatted_type = type_map.get(question_type, question_type)
    
    if question_type == "true_false":
        format_example = """1. Question?
Answer: True

2. Another question?
Answer: False"""
    else:
        format_example = """1. Question?
A) Option 1
B) Option 2  
C) Option 3
D) Option 4
Answer: B"""

    prompt = f"""Generate exactly {num_items} {formatted_type} questions from this content:

{lesson_content}

Rules:
- Every question must have exactly one correct answer
- No N/A or None answers
- Questions must test key concepts
- Return only the questions and answers

Format each question like this:
{format_example}

Generate {num_items} questions now:"""

    try:
        # Smart timeout based on question count
        base_timeout = 60  # Base 1 minute
        timeout_seconds = base_timeout + (num_items_int * 2)
        timeout_seconds = min(timeout_seconds, 240)  # Max 4 minutes
        
        print(f"⏱️  Timeout: {timeout_seconds}s")
        print(f"🚀 Starting generation...")
        
        raw_questions = await generator.generate_quiz(
            prompt=prompt,
            num_questions=num_items_int,
            timeout=timeout_seconds,
        )
        
        if not raw_questions:
            print("❌ Error: Empty response")
            return []

        parsed_questions = parse_questions(raw_questions)
        
        print(f"\n" + "="*50)
        print(f"✅ GENERATION COMPLETE")
        print(f"📊 Final model: {generator.current_model}")
        print(f"📈 Questions generated: {len(parsed_questions)}/{num_items_int}")
        print("="*50)
        
        # Show key statistics
        key_stats = generator.get_key_stats()
        print(f"🔑 Key Statistics:")
        for key_id, stats in key_stats.items():
            print(f"   {key_id}: {stats['requests']} req, {stats['success_rate']}")
        
        return parsed_questions[:num_items_int]
    
    except Exception as e:
        error_msg = str(e)
        print(f"\n❌ Groq failed: {error_msg[:200]}")
        
        # Check if it's a context window error
        if "8192" in error_msg or "max_tokens" in error_msg:
            print(f"💡 Compound model limit is 8192 tokens")
            print(f"💡 Try: 1) Fewer questions (<15), 2) Shorter lesson content")
        
        # Try Gemini fallback
        print(f"🔄 Attempting Gemini fallback...")
        return await _fallback_to_gemini(prompt, num_items_int)

async def _fallback_to_gemini(prompt: str, num_items: int):
    """Fallback to Gemini with correct model name"""
    try:
        print("🔀 Switching to Gemini...")
        gemini_model = get_gemini_model()
        
        # Try different model names
        model_names = [
            "gemini-1.5-flash",
            "gemini-1.5-pro", 
            "gemini-1.0-pro",
            "models/gemini-1.5-flash"
        ]
        
        for model_name in model_names:
            try:
                print(f"   Trying model: {model_name}")
                response = await gemini_model.generate_content_async(
                    prompt,
                    # Add model name if your gemini.py supports it
                )
                raw_questions = response.text
                
                if raw_questions:
                    parsed_questions = parse_questions(raw_questions)
                    print(f"✅ Gemini ({model_name}) generated {len(parsed_questions)} questions")
                    return parsed_questions[:num_items]
            except Exception as model_error:
                print(f"   ❌ {model_name} failed: {str(model_error)[:80]}")
                continue
        
        print("❌ All Gemini models failed")
        return []
        
    except Exception as gemini_error:
        print(f"❌ Gemini failed: {gemini_error}")
        return []