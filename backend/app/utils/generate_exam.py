import asyncio
import os
import time
from typing import List, Dict, Any
from dataclasses import dataclass
from collections import defaultdict

# Import from UPDATED groq_model
from app.core.groq_model import get_groq_model
from .parse_questions import parse_questions
from .get_lesson_content import get_lesson_content
from .content_compressor import ContentCompressor

# ===== CONFIGURATION =====
MODEL_NAME = "meta-llama/llama-4-scout-17b-16e-instruct"

# ===== DATA CLASSES =====
@dataclass
class AccurateAPIKey:
    key: str
    prompt_tokens_used: int = 0
    completion_tokens_used: int = 0
    total_tokens_used: int = 0
    requests_made: int = 0
    last_reset: float = time.time()
    is_active: bool = True
    tpm_limit: int = 30000
    
    @property
    def tokens_available(self) -> int:
        if time.time() - self.last_reset > 60:
            self.prompt_tokens_used = 0
            self.completion_tokens_used = 0
            self.total_tokens_used = 0
            self.last_reset = time.time()
        return self.tpm_limit - self.total_tokens_used
    
    def record_usage(self, prompt_tokens: int, completion_tokens: int):
        self.prompt_tokens_used += prompt_tokens
        self.completion_tokens_used += completion_tokens
        self.total_tokens_used += (prompt_tokens + completion_tokens)
        self.requests_made += 1

# ===== MAIN GENERATOR CLASS =====
class RealisticExamGenerator:
    def __init__(self):
        self.keys = self._load_keys()
        self.content_compressor = ContentCompressor()
        self.token_stats = {
            "content_tokens_saved": 0,
            "compression_ratio": 0,
            "total_input_tokens": 0,
            "total_output_tokens": 0
        }
        
    def _load_keys(self) -> List[AccurateAPIKey]:
        keys = []
        for i in range(1, 5):
            key_value = os.getenv(f"GROQ_API_KEY_{i}")
            if key_value and key_value.strip():
                keys.append(AccurateAPIKey(key=key_value.strip()))
                print(f"[KEY] Loaded key {i}: {key_value[:10]}...")
        
        if not keys:
            key_value = os.getenv("GROQ_API_KEY")
            if key_value:
                keys.append(AccurateAPIKey(key=key_value.strip()))
                print(f"[KEY] Loaded default key: {key_value[:10]}...")
        
        total_tpm = sum(k.tpm_limit for k in keys)
        print(f"[CAPACITY] {len(keys)} keys → {total_tpm:,} total TPM")
        return keys
    
    def prepare_lesson_content(self, content: str, num_questions: int) -> str:
        """
        Prepare lesson content with sensible compression limits
        """
        # Minimum content for ANY questions
        MIN_CONTENT_TOKENS = 800  # Absolute minimum
        
        # Calculate based on number of questions
        # Each question needs context
        base_content = max(num_questions * 150, MIN_CONTENT_TOKENS)
        
        # Don't exceed reasonable limits
        MAX_CONTENT_TOKENS = 3500
        
        target_tokens = min(base_content, MAX_CONTENT_TOKENS)
        
        original_tokens = ContentCompressor.estimate_tokens(content)
        
        # If content is already reasonable size, use it as-is
        if original_tokens <= target_tokens * 1.5:
            print(f"[CONTENT] Content is reasonable size: {original_tokens:,} tokens")
            return content
        
        print(f"[CONTENT] Need to compress: {original_tokens:,} → {target_tokens:,} tokens")
        
        # Compress with minimum guarantee
        compressed = self.content_compressor.compress_content(content, target_tokens)
        compressed_tokens = ContentCompressor.estimate_tokens(compressed)
        
        # Ensure we have meaningful content
        if compressed_tokens < 300:
            print(f"[WARNING] Compression too aggressive! Only {compressed_tokens} tokens")
            # Fallback: return first N characters
            fallback_chars = target_tokens * 3  # ~3 chars per token
            compressed = content[:fallback_chars] + "..."
            if len(content) > fallback_chars:
                compressed += content[-500:]  # Add ending for context
            compressed_tokens = ContentCompressor.estimate_tokens(compressed)
        
        print(f"[CONTENT] Final: {compressed_tokens:,} tokens")
        return compressed
    
    def create_efficient_prompt(self, compressed_content: str, num_questions: int, 
                              title: str, lesson_id: int) -> str:
        """
        SIMPLIFIED prompt that actually works
        """
        prompt = f"""Create {num_questions} multiple-choice exam questions from this content:

{compressed_content}

Format each question exactly like this:
1. [Question about the content] (Remembering/Understanding/Analysis)
A. [Option 1]
B. [Option 2]
C. [Option 3]
D. [Option 4]
Answer: [Letter]

Make {max(1, num_questions//3)} Remembering questions, {max(1, num_questions//3)} Understanding questions, and the rest Analysis questions.

Create {num_questions} questions now:"""
        
        return prompt
    
    async def generate_realistic_batch(self, key: AccurateAPIKey, lesson_id: int, 
                                     original_content: str, num_questions: int, 
                                     title: str) -> List[Dict[str, Any]]:
        compressed_content = self.prepare_lesson_content(original_content, num_questions)
        prompt = self.create_efficient_prompt(compressed_content, num_questions, title, lesson_id)
        
        estimated_input = ContentCompressor.estimate_tokens(prompt)
        estimated_output = num_questions * 150
        estimated_total = estimated_input + estimated_output
        
        print(f"[ESTIMATE] Lesson {lesson_id}: Input={estimated_input:,}, Output={estimated_output:,}, Total={estimated_total:,}")
        
        if key.tokens_available < estimated_total:
            print(f"[CAPACITY] Key has {key.tokens_available:,} tokens, needs {estimated_total:,}")
            return []
        
        try:
            # DEBUG: Check what we're sending
            print(f"[DEBUG] Prompt length: {len(prompt)} characters")
            print(f"[DEBUG] Prompt preview: {prompt[:200]}...")
            
            model = get_groq_model(api_key=key.key, model_name=MODEL_NAME)
            
            response = await model.generate_content_async(
                prompt=prompt,
                max_tokens=estimated_output,
                temperature=0.4
            )
            
            # DEBUG: What did we get back?
            print(f"[DEBUG] Response length: {len(response.text)} characters")
            print(f"[DEBUG] Response preview: {response.text[:300]}...")
            
            if hasattr(response, '_response') and hasattr(response._response, 'usage'):
                actual_input = response._response.usage.prompt_tokens
                actual_output = response._response.usage.completion_tokens
                actual_total = response._response.usage.total_tokens
            else:
                actual_input = estimated_input
                actual_output = estimated_output
                actual_total = estimated_total
            
            key.record_usage(actual_input, actual_output)
            self.token_stats["total_input_tokens"] += actual_input
            self.token_stats["total_output_tokens"] += actual_output
            
            print(f"[ACTUAL] Used: Input={actual_input:,}, Output={actual_output:,}, Total={actual_total:,}")
            print(f"[REMAINING] Key {key.key[:10]}...: {key.tokens_available:,} tokens available")
            
            if response and response.text:
                questions = parse_questions(response.text)
                print(f"[DEBUG] Parsed {len(questions)} questions from response")
                
                for q in questions:
                    q["lesson_id"] = lesson_id
                    q["lesson_title"] = title
                
                return questions[:num_questions]
            
            return []
            
        except Exception as e:
            print(f"[API ERROR] {e}")
            import traceback
            traceback.print_exc()
            return []
    
    async def generate_lesson_questions(self, lesson_id: int, total_questions: int, 
                                      title: str = "") -> List[Dict[str, Any]]:
        content = get_lesson_content(lesson_id)
        if not content:
            print(f"[ERROR] No content for lesson {lesson_id}")
            return []
        
        all_questions = []
        remaining_questions = total_questions
        max_attempts = 3  # Limit attempts per lesson
        attempts = 0
        
        while remaining_questions > 0 and len(all_questions) < total_questions and attempts < max_attempts:
            attempts += 1
            batch_size = min(remaining_questions, 5)  # Smaller batches
            
            available_keys = [k for k in self.keys if k.is_active and k.tokens_available > 2000]
            if not available_keys:
                print(f"[WAIT] No keys available for lesson {lesson_id}, waiting...")
                await asyncio.sleep(1)
                continue
            
            best_key = max(available_keys, key=lambda k: k.tokens_available)
            
            print(f"[ATTEMPT {attempts}/{max_attempts}] Generating {batch_size} questions...")
            batch_questions = await self.generate_realistic_batch(
                best_key, lesson_id, content, batch_size, title
            )
            
            if batch_questions:
                all_questions.extend(batch_questions)
                remaining_questions -= len(batch_questions)
                print(f"[PROGRESS] {lesson_id}: {len(all_questions)}/{total_questions} questions")
                attempts = 0  # Reset attempts on success
            else:
                print(f"[WARNING] Attempt {attempts} failed for lesson {lesson_id}")
            
            await asyncio.sleep(0.5)
        
        return all_questions[:total_questions]

# ===== MAIN GENERATION FUNCTIONS =====
async def generate_exam_realistic(tos_array: List[Dict], target_total: int = 100) -> List[Dict[str, Any]]:
    print(f"\n{'='*70}")
    print(f"REALISTIC EXAM GENERATION - ACCOUNTING FOR CONTENT TOKENS")
    print(f"Target: {target_total} questions | Model: {MODEL_NAME}")
    print(f"{'='*70}")
    
    lessons_data = []
    total_content_tokens = 0
    
    for row in tos_array:
        lesson_id = row.get("lesson_id")
        num_questions = row.get("items", 0)
        title = row.get("title", f"Lesson {lesson_id}")
        
        if num_questions <= 0:
            continue
        
        content = get_lesson_content(lesson_id)
        if not content:
            print(f"[SKIP] No content for {title}")
            continue
        
        content_tokens = ContentCompressor.estimate_tokens(content)
        total_content_tokens += content_tokens
        
        lessons_data.append({
            "id": lesson_id,
            "title": title,
            "questions_needed": num_questions,
            "content": content,
            "original_tokens": content_tokens
        })
        
        print(f"  {title}: {num_questions} questions, {content_tokens:,} content tokens")
    
    print(f"\n[TOTAL] {len(lessons_data)} lessons, {total_content_tokens:,} total content tokens")
    
    generator = RealisticExamGenerator()
    total_key_capacity = sum(k.tpm_limit for k in generator.keys)
    
    estimated_needs = {
        "content_tokens": total_content_tokens,
        "instruction_tokens": target_total * 20,
        "output_tokens": target_total * 150,
        "total_tokens": 0
    }
    
    estimated_needs["total_tokens"] = (
        estimated_needs["content_tokens"] * 0.3 +
        estimated_needs["instruction_tokens"] +
        estimated_needs["output_tokens"]
    )
    
    print(f"\n[ESTIMATE] Token requirements:")
    print(f"  Original content: {estimated_needs['content_tokens']:,} tokens")
    print(f"  After compression: {estimated_needs['content_tokens'] * 0.3:,.0f} tokens (70% savings)")
    print(f"  Instructions: {estimated_needs['instruction_tokens']:,} tokens")
    print(f"  Output: {estimated_needs['output_tokens']:,} tokens")
    print(f"  TOTAL ESTIMATED: {estimated_needs['total_tokens']:,.0f} tokens")
    print(f"\n[CAPACITY] Available: {total_key_capacity:,} TPM")
    print(f"  Time needed: {estimated_needs['total_tokens'] / total_key_capacity:.2f} minutes")
    
    print(f"\n[PHASE 2] Generating questions...")
    all_questions = []
    
    for lesson in lessons_data:
        print(f"\n[LESSON] {lesson['title']}: {lesson['questions_needed']} questions")
        
        questions = await generator.generate_lesson_questions(
            lesson["id"], 
            lesson["questions_needed"], 
            lesson["title"]
        )
        
        if questions:
            all_questions.extend(questions)
            print(f"[COMPLETE] {lesson['title']}: {len(questions)} questions generated")
        else:
            print(f"[WARNING] {lesson['title']}: 0 questions generated")
    
    for idx, q in enumerate(all_questions):
        q["number"] = idx + 1
        q["points"] = 1
        q["generated_by"] = MODEL_NAME
    
    print(f"\n{'='*70}")
    print(f"GENERATION COMPLETE")
    print(f"{'='*70}")
    print(f"Questions generated: {len(all_questions)}/{target_total}")
    
    total_input = generator.token_stats["total_input_tokens"]
    total_output = generator.token_stats["total_output_tokens"]
    total_used = total_input + total_output
    
    print(f"\n[TOKEN USAGE]")
    print(f"  Input tokens: {total_input:,} (Content + Instructions)")
    print(f"  Output tokens: {total_output:,} (Questions generated)")
    print(f"  Total tokens: {total_used:,}")
    print(f"  Content tokens saved: {generator.token_stats['content_tokens_saved']:,}")
    
    return all_questions[:target_total]

def generate_exam_realistic_sync(tos_array: List[Dict], target_total: int = 100) -> List[Dict[str, Any]]:
    try:
        return asyncio.run(generate_exam_realistic(tos_array, target_total))
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(generate_exam_realistic(tos_array, target_total))
        finally:
            loop.close()

# ===== TEST FUNCTION =====
async def test_single_question():
    """Test generating just 1 question"""
    content = get_lesson_content(14)  # Your lesson ID
    if not content:
        print("No content for lesson 14")
        return
    
    print(f"\n{'='*60}")
    print(f"TESTING SINGLE QUESTION GENERATION")
    print(f"{'='*60}")
    
    print(f"Original content: {len(content)} characters")
    print(f"Estimated tokens: {ContentCompressor.estimate_tokens(content)}")
    
    # Test compression
    compressor = ContentCompressor()
    compressed = compressor.compress_content(content, 1000)
    print(f"\nCompressed: {len(compressed)} characters")
    print(f"Compressed tokens: {ContentCompressor.estimate_tokens(compressed)}")
    print(f"\nCompressed preview:\n{compressed[:500]}...")
    
    # Test prompt
    generator = RealisticExamGenerator()
    prompt = generator.create_efficient_prompt(compressed, 1, "Test Lesson", 14)
    print(f"\nPrompt preview ({len(prompt)} chars):\n{prompt[:300]}...")
    
    # Test API
    if generator.keys:
        key = generator.keys[0]
        questions = await generator.generate_realistic_batch(key, 14, content, 1, "Test")
        print(f"\nGenerated questions: {len(questions)}")
        if questions:
            print(f"First question: {questions[0]}")