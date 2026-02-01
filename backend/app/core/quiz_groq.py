"""
quiz_groq.py - Simple Groq model specifically for quizzes
This uses 3 of your 4 API keys and is designed for quiz generation only.
"""

import os
import time
from typing import List
from groq import AsyncGroq

class QuizGroqModel:
    """Simple model for quizzes only - uses 3 keys with TPM checking"""
    
    def __init__(self):
        self.keys = self._load_quiz_keys()
        self.model_name = "meta-llama/llama-4-scout-17b-16e-instruct"
        self.clients = {}
        self.current_key_index = 0
        
        # TPM tracking
        self.tpm_limit = 30000  # 30k tokens per minute
        self.usage = {key: {"tokens": 0, "last_reset": time.time()} for key in self.keys}
        
        print(f"[QUIZ] Using {len(self.keys)} keys for quizzes")
        print(f"[QUIZ] Model: {self.model_name}")
        print(f"[QUIZ] TPM limit per key: {self.tpm_limit:,}")
    
    def _load_quiz_keys(self) -> List[str]:
        """Load 3 keys from your 4-key pool"""
        all_keys = []
        
        # Try to get all available keys
        patterns = [
            "GROQ_API_KEY",
            "GROQ_API_KEYS",
            "GROQ_API_KEY_1",
            "GROQ_API_KEY_2", 
            "GROQ_API_KEY_3",
            "GROQ_API_KEY_4"
        ]
        
        for pattern in patterns:
            key = os.getenv(pattern)
            if key:
                if "," in key:
                    # Handle comma-separated list
                    for k in key.split(","):
                        k = k.strip()
                        if self._is_valid_key(k):
                            all_keys.append(k)
                else:
                    if self._is_valid_key(key):
                        all_keys.append(key)
        
        # Remove duplicates
        unique_keys = []
        seen = set()
        for key in all_keys:
            if key not in seen:
                seen.add(key)
                unique_keys.append(key)
        
        # Take first 3 keys for quizzes
        quiz_keys = unique_keys[:3]
        
        if len(quiz_keys) < 1:
            raise RuntimeError("Need at least 1 API key for quizzes")
        
        return quiz_keys
    
    def _is_valid_key(self, key: str) -> bool:
        """Validate API key format"""
        return bool(key and len(key) > 20 and key.startswith("gsk_"))
    
    def _get_next_key(self, estimated_tokens: int = 5000) -> str:
        """
        Get next available key with TPM checking
        
        Args:
            estimated_tokens: Estimated tokens for this request (default 5k)
        """
        current_time = time.time()
        
        # Try each key in rotation
        for attempt in range(len(self.keys)):
            key = self.keys[self.current_key_index]
            
            # Reset if minute passed
            if current_time - self.usage[key]["last_reset"] > 60:
                self.usage[key]["tokens"] = 0
                self.usage[key]["last_reset"] = current_time
            
            # Check if key has capacity (leave 20% buffer)
            available_tokens = self.tpm_limit - self.usage[key]["tokens"]
            buffer_tokens = int(self.tpm_limit * 0.2)  # 20% buffer
            
            if available_tokens - estimated_tokens > buffer_tokens:
                # This key has capacity
                self.current_key_index = (self.current_key_index + 1) % len(self.keys)
                return key
            
            # Try next key
            self.current_key_index = (self.current_key_index + 1) % len(self.keys)
        
        # All keys at limit - wait and retry
        time.sleep(5)
        
        # Reset all counters and try again
        for key in self.keys:
            self.usage[key]["tokens"] = 0
            self.usage[key]["last_reset"] = time.time()
        
        return self._get_next_key(estimated_tokens)
    
    def _get_client(self, key: str) -> AsyncGroq:
        """Get or create client for a key"""
        if key not in self.clients:
            self.clients[key] = AsyncGroq(api_key=key)
        return self.clients[key]
    
    def _update_token_usage(self, key: str, tokens: int):
        """Update token usage after successful request"""
        if key in self.usage:
            self.usage[key]["tokens"] += tokens
    
    async def generate(self, prompt: str, **kwargs) -> str:
        """
        Generate quiz content
        
        Args:
            prompt: The prompt to send
            **kwargs: Additional parameters (temperature, max_tokens, etc.)
            
        Returns:
            Generated text
        """
        # Estimate tokens for this request (prompt + max response)
        estimated_tokens = len(prompt) // 4 + kwargs.get("max_tokens", 10000)
        
        key = self._get_next_key(estimated_tokens)
        client = self._get_client(key)
        
        params = {
            "model": self.model_name,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": kwargs.get("temperature", 0.2),
            "max_tokens": kwargs.get("max_tokens", 10000),
        }
        
        # Add optional parameters
        optional_params = ["top_p", "stream", "stop", "seed"]
        for param in optional_params:
            if param in kwargs:
                params[param] = kwargs[param]
        
        try:
            response = await client.chat.completions.create(**params)
            
            # Track actual token usage
            if response.usage:
                tokens_used = response.usage.total_tokens
                self._update_token_usage(key, tokens_used)
            
            return response.choices[0].message.content
            
        except Exception as e:
            # If it's a rate limit error, mark key as full and retry
            if "rate limit" in str(e).lower() or "429" in str(e):
                self.usage[key]["tokens"] = self.tpm_limit  # Mark as full
                return await self.generate(prompt, **kwargs)  # Retry with next key
            
            # For other errors, try next key
            self.current_key_index = (self.current_key_index + 1) % len(self.keys)
            raise

# Create a global instance for easy use
_quiz_model = None

def get_quiz_model() -> QuizGroqModel:
    """Get the global quiz model instance"""
    global _quiz_model
    if _quiz_model is None:
        _quiz_model = QuizGroqModel()
    return _quiz_model