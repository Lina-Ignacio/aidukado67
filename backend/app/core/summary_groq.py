"""
summary_groq.py - Simple Groq model specifically for summaries
This uses 2 of your 4 API keys and is designed for summary generation only.
"""

import os
import time
from typing import List, Optional
from groq import AsyncGroq

class SummaryGroqModel:
    """Simple model for summaries only - uses 2 keys"""
    
    def __init__(self):
        self.keys = self._load_summary_keys()
        self.model_name = "llama-3.1-8b-instant"  
        self.clients = {}
        self.current_key_index = 0
        self.usage = {key: {"tokens": 0, "last_reset": time.time()} for key in self.keys}
        
        print(f"[SUMMARY] Using {len(self.keys)} keys for summaries")
    
    def _load_summary_keys(self) -> List[str]:
        """Load 2 keys from your 4-key pool"""
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
            if key and key.startswith("gsk_") and len(key) > 20:
                if "," in key:
                    # Handle comma-separated list
                    for k in key.split(","):
                        k = k.strip()
                        if k.startswith("gsk_") and len(k) > 20:
                            all_keys.append(k)
                else:
                    all_keys.append(key)
        
        # Remove duplicates
        unique_keys = []
        seen = set()
        for key in all_keys:
            if key not in seen:
                seen.add(key)
                unique_keys.append(key)
        
        # Take first 2 keys for summaries
        summary_keys = unique_keys[:2]
        
        if len(summary_keys) < 1:
            raise RuntimeError("Need at least 1 API key for summaries")
        
        return summary_keys
    
    def _get_next_key(self) -> str:
        """Simple round-robin key rotation"""
        key = self.keys[self.current_key_index]
        self.current_key_index = (self.current_key_index + 1) % len(self.keys)
        
        # Reset token count if minute passed
        if time.time() - self.usage[key]["last_reset"] > 60:
            self.usage[key]["tokens"] = 0
            self.usage[key]["last_reset"] = time.time()
        
        return key
    
    def _get_client(self, key: str) -> AsyncGroq:
        """Get or create client for a key"""
        if key not in self.clients:
            self.clients[key] = AsyncGroq(api_key=key)
        return self.clients[key]
    
    async def generate(self, prompt: str, **kwargs) -> str:
        """
        Simple generate method that returns text
        
        Usage:
            model = SummaryGroqModel()
            result = await model.generate("Your prompt")
        """
        key = self._get_next_key()
        client = self._get_client(key)
        
        params = {
            "model": self.model_name,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": kwargs.get("temperature", 0.3),
            "max_tokens": kwargs.get("max_tokens", 1500),
        }
        
        try:
            print(f"[SUMMARY] Using key {key[:10]}...")
            
            response = await client.chat.completions.create(**params)
            
            # Track usage
            if response.usage:
                tokens = response.usage.total_tokens
                self.usage[key]["tokens"] += tokens
            
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"[SUMMARY ERROR] {e}")
            # Try with next key
            self.current_key_index = (self.current_key_index + 1) % len(self.keys)
            raise

# Create a global instance for easy use
_summary_model = None

def get_summary_model() -> SummaryGroqModel:
    """Get the global summary model instance"""
    global _summary_model
    if _summary_model is None:
        _summary_model = SummaryGroqModel()
    return _summary_model