
from slowapi import Limiter
from slowapi.util import get_remote_address
import os


limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["3000/hour"],
    
    # enabled=os.getenv("ENVIRONMENT") == "production"
)