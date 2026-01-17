from fastapi import Request, Depends, HTTPException, status
from jose import jwt, JWTError
from app.config import SECRET_KEY, ALGORITHM
from app.database import get_db
from sqlalchemy.orm import Session
from app.models import Users 

def get_current_user(request: Request, db: Session = Depends(get_db)):
    
    token = request.cookies.get("access_token")
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Session expired or not authenticated"
        )
    
    try:
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub") 
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Invalid token data"
            )
            
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Authentication failed"
        )
        
    
    
    user = db.query(Users).filter(Users.id == int(user_id)).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="User not found"
        )
        
    return user