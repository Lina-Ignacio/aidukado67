from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from jose import jwt, JWTError
from app.config import SECRET_KEY, ALGORITHM
from app.context import current_user_id
import logging

logger = logging.getLogger(__name__)

class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        user_id = None
        
        # Extract token from cookie (your existing method)
        token = request.cookies.get("access_token")
        
        if token:
            try:
                # Decode JWT to get user ID from 'sub' claim
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                user_id_from_token = payload.get("sub")
                
                
                if user_id_from_token:
                    user_id = int(user_id_from_token)
                    logger.debug(f"User {user_id} authenticated for this request")
            except JWTError as e:
                # Just log the error, don't block the request
                logger.warning(f"Invalid token: {e}")
        
        # Store user ID in context var for this request only
        token_ctx = current_user_id.set(user_id)
        
        try:
            # Process the request
            response = await call_next(request)
            return response
        finally:
            # Clean up - crucial to prevent memory leaks
            current_user_id.reset(token_ctx)
            logger.debug("Cleaned up user context")

