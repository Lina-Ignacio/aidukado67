"""
quiz_groq_optimized.py - Fixed with correct 8192 context window for compound models
"""

import os
import time
import asyncio
from typing import List, Optional, Dict
from groq import AsyncGroq
from dataclasses import dataclass

@dataclass
class ModelConfig:
    name: str
    tpm_limit: int  # Tokens per minute (SPEED limit)
    tpd_limit: int  # Tokens per day
    rpm_limit: int  # Requests per minute
    rpd_limit: int  # Requests per day
    speed_rating: int
    context_window: int  # Max tokens per request (SIZE limit) - CRITICAL!
    quality_rating: int
    cost_per_1k_tokens: float = 0

# Correct values from your Groq console
FREE_MODELS = {
    "compound": ModelConfig(
        name="groq/compound",
        tpm_limit=70000,      # 70K tokens/minute
        tpd_limit=-1,
        rpm_limit=30,
        rpd_limit=250,
        speed_rating=7,
        context_window=8192,  # 8,192 tokens max per request
        quality_rating=8
    ),
    "compound-mini": ModelConfig(
        name="groq/compound-mini",
        tpm_limit=70000,      # 70K tokens/minute
        tpd_limit=-1,
        rpm_limit=30,
        rpd_limit=250,
        speed_rating=9,
        context_window=8192,  # 8,192 tokens max per request
        quality_rating=7
    ),
    "llama-4-scout-17b": ModelConfig(
        name="meta-llama/llama-4-scout-17b-16e-instruct",
        tpm_limit=30000,      # 30K tokens/minute
        tpd_limit=500000,
        rpm_limit=30,
        rpd_limit=1000,
        speed_rating=6,
        context_window=32768, # 32,768 tokens max per request
        quality_rating=9
    ),
}

class OptimizedQuizGroqModel:
    
    def __init__(self):
        self.keys = self._load_all_keys()
        self.current_key_index = 0
        
        # Start with primary model
        self.model_config = FREE_MODELS["compound"]
        self.current_model = self.model_config.name
        self.model_priority = ["compound", "compound-mini", "llama-4-scout-17b"]
        self.current_model_index = 0
        
        # Token and request tracking
        self.daily_tokens = 0
        self.daily_requests = 0
        self.daily_limit = 1000000
        self.start_of_day = time.time()
        
        # Create clients and track usage
        self.clients = {}
        self.key_stats = {}
        for i, key in enumerate(self.keys):
            self.clients[key] = AsyncGroq(api_key=key, timeout=90.0)
            self.key_stats[key] = {
                "index": i,
                "tokens_used": 0,
                "requests_used": 0,
                "last_reset": time.time(),
                "last_used": 0,
                "total_requests": 0,
                "total_tokens": 0,
                "failures": 0,
                "successes": 0,
            }
        
        print(f"✨ Initialized with {len(self.keys)} keys")
        print(f"📊 Model: {self.current_model}")
        print(f"🚀 TPM: {self.model_config.tpm_limit:,} tokens/minute")
        print(f"📐 Context window: {self.model_config.context_window:,} tokens/request")
        print(f"🔄 Key rotation: ACTIVE")
    
    def _load_all_keys(self) -> List[str]:
        """Load all possible API keys"""
        keys = []
        
        env_patterns = [
            "GROQ_API_KEY_1", "GROQ_API_KEY_2", 
            "GROQ_API_KEY_3", "GROQ_API_KEY_4",
            "GROQ_API_KEY", "GROQ_API_KEYS",
        ]
        
        for pattern in env_patterns:
            env_value = os.getenv(pattern)
            if env_value:
                if "," in env_value:
                    for key in env_value.split(","):
                        key = key.strip()
                        if key.startswith("gsk_") and key not in keys:
                            keys.append(key)
                elif env_value.startswith("gsk_") and env_value not in keys:
                    keys.append(env_value)
        
        if not keys:
            raise RuntimeError("No API keys found")
        
        print(f"🔑 Loaded {len(keys)} keys")
        return keys
    
    def _get_next_available_key(self, estimated_tokens: int) -> Optional[Dict]:
        """
        Round-robin key selection with capacity checking
        """
        now = time.time()
        total_keys = len(self.keys)
        
        for attempt in range(total_keys):
            key = self.keys[self.current_key_index]
            stats = self.key_stats[key]
            
            # Move to next key for next call
            self.current_key_index = (self.current_key_index + 1) % total_keys
            
            # Reset if minute passed
            if now - stats["last_reset"] > 60:
                stats["tokens_used"] = 0
                stats["requests_used"] = 0
                stats["last_reset"] = now
            
            # Check RPM limit
            if stats["requests_used"] >= self.model_config.rpm_limit:
                continue
            
            # Check TPM limit (use 80% for safety)
            if stats["tokens_used"] + estimated_tokens > self.model_config.tpm_limit * 0.8:
                continue
            
            # This key is available!
            stats["last_used"] = now
            return {"key": key, "stats": stats}
        
        return None
    
    async def _wait_for_available_key(self, estimated_tokens: int, max_wait: int = 30) -> Dict:
        """Wait for an available key"""
        start = time.time()
        
        while time.time() - start < max_wait:
            result = self._get_next_available_key(estimated_tokens)
            if result:
                return result
            
            wait_time = 5
            print(f"⏳ All keys at capacity, waiting {wait_time}s...")
            await asyncio.sleep(wait_time)
        
        raise RuntimeError("No API keys available after waiting")
    
    def _update_key_stats(self, key: str, stats: Dict, tokens_used: int, success: bool = True):
        """Update key statistics after request"""
        stats["total_requests"] += 1
        
        if success:
            stats["tokens_used"] += tokens_used
            stats["requests_used"] += 1
            stats["successes"] += 1
            stats["total_tokens"] += tokens_used
        else:
            stats["failures"] += 1
    
    def _switch_to_next_model(self):
        """Switch to next model in priority list"""
        if self.current_model_index >= len(self.model_priority) - 1:
            print("❌ All models exhausted")
            return False
        
        self.current_model_index += 1
        next_model_name = self.model_priority[self.current_model_index]
        old_model = self.current_model
        
        self.model_config = FREE_MODELS[next_model_name]
        self.current_model = self.model_config.name
        
        print(f"🔄 Switching model: {old_model} → {self.current_model}")
        print(f"📊 New TPM: {self.model_config.tpm_limit:,}")
        print(f"📐 New context window: {self.model_config.context_window:,}")
        
        return True
    
    def _estimate_quiz_tokens(self, prompt: str, num_questions: int) -> int:
        """
        Smart token estimation - MUST stay under context_window
        """
        # Conservative estimation: ~3.5 chars per token
        prompt_tokens = len(prompt) // 3
        
        # Adjust tokens per question based on count
        if num_questions <= 5:
            tokens_per_question = 200
        elif num_questions <= 10:
            tokens_per_question = 180
        elif num_questions <= 15:
            tokens_per_question = 150
        elif num_questions <= 20:
            tokens_per_question = 130
        else:
            tokens_per_question = 100  # Very conservative for large quizzes
        
        response_tokens = num_questions * tokens_per_question
        total = prompt_tokens + response_tokens
        
        # Add 20% buffer
        total_with_buffer = int(total * 1.2)
        
        # CRITICAL: Must stay under model's context window
        max_allowed = int(self.model_config.context_window * 0.85)  # 85% of limit for safety
        
        if total_with_buffer > max_allowed:
            print(f"⚠️  Warning: Estimate {total_with_buffer:,} > {max_allowed:,} limit!")
            # Auto-reduce estimate
            total_with_buffer = max_allowed
        
        print(f"   Prompt: {len(prompt):,} chars → {prompt_tokens:,} tokens")
        print(f"   Response: {num_questions} questions → {response_tokens:,} tokens")
        print(f"   Total with buffer: {total_with_buffer:,} tokens")
        print(f"   Max allowed: {max_allowed:,} tokens (85% of {self.model_config.context_window:,})")
        
        return min(total_with_buffer, max_allowed)
    
    async def generate_quiz(
        self,
        prompt: str,
        num_questions: int = 10,
        timeout: int = 180
    ) -> str:
        """
        Generate quiz with proper limits
        """
        # Estimate tokens
        estimated_tokens = self._estimate_quiz_tokens(prompt, num_questions)
        
        print(f"\n📋 Request: {num_questions} questions")
        print(f"📊 Model: {self.current_model}")
        print(f"📏 Estimated tokens: {estimated_tokens:,}")
        print(f"🚀 TPM limit: {self.model_config.tpm_limit:,}")
        print(f"📐 Context window: {self.model_config.context_window:,}")
        
        # Check if request is feasible
        if estimated_tokens < 500:
            print("⚠️  Warning: Very low token estimate, generation may fail")
        
        # Get an available key
        key_result = await self._wait_for_available_key(estimated_tokens)
        key = key_result["key"]
        key_stats = key_result["stats"]
        client = self.clients[key]
        
        print(f"🎯 Using key #{key_stats['index']}")
        
        # CRITICAL: Set max_tokens correctly
        # For compound models: max_tokens ≤ 8192
        # Reserve space for prompt + response
        max_tokens = min(estimated_tokens, self.model_config.context_window - 500)  # 500 token buffer
        max_tokens = max(max_tokens, 1000)  # Minimum 1000 tokens
        
        print(f"🎯 Setting max_tokens to: {max_tokens:,}")
        
        try:
            print(f"🚀 Starting generation...")
            start_time = time.time()
            
            response = await asyncio.wait_for(
                client.chat.completions.create(
                    model=self.current_model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.2,
                    max_tokens=max_tokens,  # CRITICAL: Must be ≤ context_window
                    top_p=0.95,
                ),
                timeout=timeout
            )
            
            # Update key stats
            if response.usage:
                actual_tokens = response.usage.total_tokens
                self.daily_tokens += actual_tokens
                self.daily_requests += 1
                self._update_key_stats(key, key_stats, actual_tokens, success=True)
                print(f"📊 Actual tokens used: {actual_tokens:,}")
            
            elapsed = time.time() - start_time
            print(f"✅ Generated in {elapsed:.2f}s")
            
            return response.choices[0].message.content
            
        except asyncio.TimeoutError:
            print(f"❌ Timeout after {timeout}s")
            self._update_key_stats(key, key_stats, estimated_tokens, success=False)
            
            # Try next model
            if self._switch_to_next_model():
                print(f"🔄 Retrying with new model...")
                return await self.generate_quiz(prompt, num_questions, timeout)
            raise
            
        except Exception as e:
            error_msg = str(e)
            print(f"❌ Error: {error_msg[:100]}")
            self._update_key_stats(key, key_stats, estimated_tokens, success=False)
            
            # Check if it's a context window error
            if "max_tokens" in error_msg and "8192" in error_msg:
                print(f"⚠️  Context window error! Compound model limit is 8192 tokens")
                print(f"💡 Try: 1) Fewer questions, 2) Shorter prompt, 3) Switch to llama-4-scout")
                
                # Switch to llama-4-scout which has 32K context
                if "compound" in self.current_model:
                    print(f"🔄 Switching to llama-4-scout-17b (32K context)...")
                    self.model_config = FREE_MODELS["llama-4-scout-17b"]
                    self.current_model = self.model_config.name
                    return await self.generate_quiz(prompt, num_questions, timeout)
            
            # Check if rate limit error
            if any(x in error_msg.lower() for x in ["rate limit", "429", "413"]):
                print(f"⚠️ Rate limit hit, trying next model...")
                if self._switch_to_next_model():
                    return await self.generate_quiz(prompt, num_questions, timeout)
            
            raise
    
    def get_key_stats(self) -> Dict:
        """Get statistics for all keys"""
        stats = {}
        for key, key_data in self.key_stats.items():
            total_req = key_data["total_requests"]
            success_rate = (key_data["successes"] / total_req * 100) if total_req > 0 else 0
            stats[f"key_{key_data['index']}"] = {
                "requests": total_req,
                "successes": key_data["successes"],
                "failures": key_data["failures"],
                "success_rate": f"{success_rate:.1f}%",
                "current_tpm_usage": key_data["tokens_used"],
                "tpm_limit": self.model_config.tpm_limit,
            }
        return stats
    
    def get_status(self) -> Dict:
        """Get overall status"""
        available_keys = len([
            k for k, stats in self.key_stats.items()
            if stats["tokens_used"] < self.model_config.tpm_limit * 0.8 and
               stats["requests_used"] < self.model_config.rpm_limit
        ])
        
        return {
            "current_model": self.current_model,
            "model_tpm": self.model_config.tpm_limit,
            "model_context": self.model_config.context_window,
            "daily_requests": self.daily_requests,
            "daily_tokens": self.daily_tokens,
            "keys_total": len(self.keys),
            "keys_available": available_keys,
        }

# Global instance
_quiz_generator = None

def get_quiz_generator() -> OptimizedQuizGroqModel:
    """Get or create the quiz generator"""
    global _quiz_generator
    if _quiz_generator is None:
        _quiz_generator = OptimizedQuizGroqModel()
    return _quiz_generator