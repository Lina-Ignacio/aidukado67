import os
from groq import AsyncGroq
from typing import Optional

# Model configurations
MODEL_CONFIGS = {
    "llama-3.1-8b-instant": {
        "tpm_limit": 6000,
        "rpm_limit": 30,
    },
    "meta-llama/llama-4-scout-17b-16e-instruct": {
        "tpm_limit": 30000,
        "rpm_limit": 60,
    }
}

DEFAULT_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"
_clients_cache = {}

def get_groq_model(api_key: Optional[str] = None, model_name: str = DEFAULT_MODEL):
    """
    Get a Groq model instance with support for multiple API keys.
    
    Args:
        api_key: Specific API key to use (optional, uses env var if None)
        model_name: Model to use (defaults to llama-4-scout)
    
    Returns:
        GroqModel instance
    """
    # Use provided key or get from environment
    if not api_key:
        api_key = os.getenv("GROQ_API_KEY")
    
    if not api_key:
        raise RuntimeError("No API key provided and GROQ_API_KEY not found in environment")
    
    # Create cache key
    cache_key = f"{api_key[:10]}_{model_name}"
    
    # Check cache
    if cache_key in _clients_cache:
        client = _clients_cache[cache_key]
    else:
        # Create new client
        client = AsyncGroq(api_key=api_key)
        _clients_cache[cache_key] = client
        
        config = MODEL_CONFIGS.get(model_name, MODEL_CONFIGS[DEFAULT_MODEL])
        
        print(f"[GROQ] Model: {model_name}")
        print(f"[GROQ] Using key: {api_key[:10]}...")
        print(f"[GROQ] Limits: {config['tpm_limit']:,} TPM")
    
    return GroqModel(client, model_name, api_key)

class GroqModel:
    def __init__(self, client, model_name: str, api_key: str):
        self.client = client
        self.model_name = model_name
        self.api_key = api_key
    
    async def generate_content_async(self, prompt, **kwargs):
        params = {
            "model": self.model_name,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": kwargs.get("temperature", 0.7),
        }
        
        if "max_output_tokens" in kwargs:
            params["max_tokens"] = kwargs["max_output_tokens"]
        elif "max_tokens" in kwargs:
            params["max_tokens"] = kwargs["max_tokens"]
        
        # Optional parameters
        optional_params = ["top_p", "stream", "stop", "seed"]
        for param in optional_params:
            if param in kwargs:
                params[param] = kwargs[param]
        
        try:
            response = await self.client.chat.completions.create(**params)
            return GroqResponse(response, self.model_name)
        except Exception as e:
            print(f"[ERROR] Groq API call failed: {e}")
            raise

class GroqResponse:
    def __init__(self, groq_response, model_name: str = ""):
        self._response = groq_response
        self.model_name = model_name
        self.text = groq_response.choices[0].message.content
        
        # Extract token usage if available
        self.prompt_tokens = groq_response.usage.prompt_tokens if groq_response.usage else 0
        self.completion_tokens = groq_response.usage.completion_tokens if groq_response.usage else 0
        self.total_tokens = groq_response.usage.total_tokens if groq_response.usage else 0