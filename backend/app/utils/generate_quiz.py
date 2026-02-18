import asyncio
import re
from app.core.quiz_groq_optimized import get_quiz_generator
from .parse_questions import parse_questions, validate_questions

async def generate_with_retry(generator, prompt, num_items, timeout, max_retries=3):
    """
    Generate quiz with retry logic and key rotation
    """
    for attempt in range(max_retries):
        try:
            print(f"\n🎯 Attempt {attempt + 1}/{max_retries} - Using key #{attempt}")
            
            raw_questions = await generator.generate_quiz(
                prompt=prompt,
                num_questions=num_items,
                timeout=timeout,
            )
            
            if not raw_questions:
                print(f"❌ Attempt {attempt + 1}: Empty response")
                # Rotate to next key
                if hasattr(generator, 'rotate_key'):
                    generator.rotate_key()
                continue
            
            # Show raw response preview
            print("\n🔍 RAW RESPONSE PREVIEW:")
            preview_lines = raw_questions.strip().split('\n')[:10]
            for i, line in enumerate(preview_lines, 1):
                # Truncate long lines for display
                display_line = line if len(line) < 80 else line[:77] + "..."
                print(f"  {i}: {repr(display_line)}")
            print("RAW QUESTIONS RETRY", raw_questions)
            return raw_questions
            
        except Exception as e:
            print(f"❌ Attempt {attempt + 1} failed: {str(e)[:100]}")
            if hasattr(generator, 'rotate_key'):
                generator.rotate_key()
            if attempt == max_retries - 1:
                raise
            await asyncio.sleep(1)  # Brief pause before retry
    
    return None


async def generate_quiz(lesson_content, num_items, question_type):
    """
    Smart quiz generation with context window awareness, retry logic, and validation
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
            max_lesson_length = 4000
        elif num_items_int <= 10:
            max_lesson_length = 2500
        elif num_items_int <= 15:
            max_lesson_length = 1500
        elif num_items_int <= 20:
            max_lesson_length = 800
        else:
            max_lesson_length = 500
    else:
        # Llama models: 32768 context window
        if num_items_int <= 10:
            max_lesson_length = 7000
        elif num_items_int <= 20:
            max_lesson_length = 4000
        else:
            max_lesson_length = 2000
    
    if len(lesson_content) > max_lesson_length:
        print(f"📝 Truncating lesson from {len(lesson_content):,} to {max_lesson_length:,} chars")
        lesson_content = lesson_content[:max_lesson_length] + "..."
    else:
        print(f"📝 Lesson length: {len(lesson_content):,} chars (OK)")
    
    # Create type-specific prompt
    type_map = {
        "multiple_choice": "multiple choice",
        "true_false": "True/False"
    }
    formatted_type = type_map.get(question_type, question_type)
    
    if question_type == "true_false":
        prompt = f"""Generate {num_items} True/False questions based on this content:

CONTENT:
{lesson_content}

CRITICAL RULES - YOU MUST FOLLOW EXACTLY:
- Each question must be a clear statement
- Answer MUST be EXACTLY "True" or "False" (without asterisks, bold, or quotes)
- DO NOT add any explanations after the answer
- DO NOT use letters (A, B, C, D) as answers
- DO NOT use any formatting like ** or *

FORMAT (use exactly this - NO EXTRA TEXT):
1. [Question statement]?
Answer: True

2. [Next statement]?
Answer: False

Generate {num_items} True/False questions now. Follow the format exactly. Start directly with question 1:"""
    else:
        prompt = f"""Generate {num_items} multiple choice questions based on this content:

CONTENT:
{lesson_content}

REQUIREMENTS:
- Each question must have EXACTLY 4 options (A, B, C, D)
- Answer must be a single letter (A, B, C, or D)
- Options should be plausible but only one correct
- Questions should test key concepts from the content
- DO NOT use True/False as answers

FORMAT (use exactly this - each question MUST have A, B, C, D options) :
1. [Question]?
A) [Option 1 text]
B) [Option 2 text]
C) [Option 3 text]
D) [Option 4 text]
Answer: B

2. [Next question]?
A) [Option 1 text]
B) [Option 2 text]
C) [Option 3 text]
D) [Option 4 text]
Answer: C

Generate {num_items} multiple choice questions now. Start directly with question 1:"""

    try:
        # Calculate timeout (more generous for larger question sets)
        base_timeout = 60
        timeout_seconds = base_timeout + (num_items_int * 5)  # 5 seconds per question
        timeout_seconds = min(timeout_seconds, 240)  # Max 4 minutes
        
        print(f"\n⏱️  Timeout: {timeout_seconds}s")
        print(f"🚀 Starting generation with retry logic...")
        
        # Generate with retry
        raw_questions = await generate_with_retry(
            generator=generator,
            prompt=prompt,
            num_items=num_items_int,
            timeout=timeout_seconds,
            max_retries=3
        )
        print("RAW_QUESTIONS", raw_questions)
        if not raw_questions:
            print("\n❌ All retry attempts failed. No questions generated.")
            return []
        
        # Parse questions
        parsed_questions = parse_questions(raw_questions)
        print(f"\n📊 Raw parsed: {len(parsed_questions)} questions")
        print("PARSED QUESTIONS ", parsed_questions)
        # Validate questions based on type
        valid_questions = validate_questions(
            parsed_questions, 
            question_type, 
            num_items_int
        )
        
        print(f"\n" + "="*50)
        print(f"✅ GENERATION COMPLETE")
        print(f"📊 Final model: {generator.current_model}")
        print(f"📈 Valid questions: {len(valid_questions)}/{num_items_int}")
        print("="*50)
        
        # Show key statistics
        key_stats = generator.get_key_stats()
        print(f"\n🔑 Key Statistics:")
        for key_id, stats in key_stats.items():
            print(f"   {key_id}: {stats['requests']} req, {stats['success_rate']}")
        
        # If we have valid questions, return them
        if valid_questions:
            return valid_questions[:num_items_int]
        
        # If no valid questions but we have parsed questions, show error
        if parsed_questions and not valid_questions:
            print("\n❌ No valid questions passed validation.")
            print("   This usually means the format was incorrect.")
            print("   Check the raw response preview above for formatting issues.")
        
        return []
    
    except Exception as e:
        error_msg = str(e)
        print(f"\n❌ Generation failed: {error_msg[:200]}")
        print("   Please check your Groq configuration.")
        return []