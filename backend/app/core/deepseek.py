import os
from openai import AsyncOpenAI

_client = None
_model_name = "deepseek-chat"


def get_deepseek_model():
    """DeepSeek version - returns a model instance for generating content"""
    global _client
    
    if _client:
        return DeepSeekModel(_client, _model_name)
    
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        print(f"[ERROR] DEEPSEEK_API_KEY missing.")
        raise RuntimeError("DEEPSEEK_API_KEY is missing")
    
    # Initialize DeepSeek client
    _client = AsyncOpenAI(
        api_key=api_key,
        base_url="https://api.deepseek.com"
    )
    
    print(f"[INFO] DeepSeek client initialized with model: {_model_name}")
    return DeepSeekModel(_client, _model_name)


class DeepSeekModel:
    """Wrapper for DeepSeek that provides generate_content_async method"""
    def __init__(self, client, model_name):
        self.client = client
        self.model_name = model_name
    
    async def generate_content_async(self, prompt, **kwargs):
        """
        Generate content using DeepSeek API (async version)
        
        Args:
            prompt: The text prompt to send
            **kwargs: Additional parameters (temperature, max_tokens, etc.)
        
        Returns:
            DeepSeekResponse object with .text property
        """
        # Prepare parameters
        params = {
            "model": self.model_name,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": kwargs.get("temperature", 0.7),
        }
        
        # Handle max tokens
        if "max_output_tokens" in kwargs:
            params["max_tokens"] = kwargs["max_output_tokens"]
        elif "max_tokens" in kwargs:
            params["max_tokens"] = kwargs["max_tokens"]
        
        # Generate response
        try:
            response = await self.client.chat.completions.create(**params)
            return DeepSeekResponse(response)
        except Exception as e:
            print(f"[ERROR] DeepSeek API call failed: {e}")
            raise
    
    def generate_content(self, prompt, **kwargs):
        """Sync version for compatibility"""
        import asyncio
        return asyncio.run(self.generate_content_async(prompt, **kwargs))


class DeepSeekResponse:
    """Response object from DeepSeek generation"""
    def __init__(self, openai_response):
        self._response = openai_response
        self.text = openai_response.choices[0].message.content
    
    def __str__(self):
        return self.text