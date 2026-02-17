from contextvars import ContextVar
from typing import Optional

# Simple storage for just the user ID
current_user_id: ContextVar[Optional[int]] = ContextVar("current_user_id", default=None)