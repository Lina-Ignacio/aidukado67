from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from datetime import timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func 
from jose import JWTError, jwt
from app.models.users import Users
from app.schemas.user import UserCreate, UserResponse, UserLogin, TokenResponse, UserSignup
from app.database import get_db
from app.utils.auth import hash_password, verify_password, create_access_token, get_current_user, decrypt_data, encrypt_data  
from app.config import SECRET_KEY, ALGORITHM
import os
from app.dependencies import limiter

router = APIRouter(prefix="/auth", tags=["auth"])

IS_PRODUCTION = os.getenv("ENVIRONMENT") == "production"

@router.post("/signup", response_model=UserResponse)
def signup(user: UserSignup, db: Session = Depends(get_db)):
    
    existing_user = db.query(Users).filter(Users.email == user.email).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
        
    hashed_pw = hash_password(user.password)
    
    
    db_user = Users(
        email=user.email,
        password_hash=hashed_pw,
        role="admin",
        first_name=encrypt_data(user.first_name),  
        last_name=encrypt_data(user.last_name),    
        must_change_password=True
    )
        
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Decrypt for response
    db_user.first_name = decrypt_data(db_user.first_name)
    db_user.last_name = decrypt_data(db_user.last_name)
    
    return db_user


@router.post("/login")
@limiter.limit("20/minute")
def login(request: Request, user: UserLogin, response: Response, db: Session = Depends(get_db)):
    # Find user by plain email (case-insensitive)
    db_user = db.query(Users).filter(
        func.lower(Users.email) == user.email.lower(),
        Users.is_archive == False
    ).first()
    
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(user.password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Decrypt personal data for response
    try:
        decrypted_first_name = decrypt_data(db_user.first_name) if db_user.first_name else None
        decrypted_last_name = decrypt_data(db_user.last_name) if db_user.last_name else None
        decrypted_middle_name = decrypt_data(db_user.middle_name) if db_user.middle_name else None
    except Exception as e:
        print(f"Decryption error for user {db_user.id}: {e}")
        decrypted_first_name = "[Decryption Error]"
        decrypted_last_name = "[Decryption Error]"
        decrypted_middle_name = None
    
    # Generate tokens
    access_token_expires = timedelta(minutes=120)
    refresh_token_expires = timedelta(days=7)
    
    payload = {
        "sub": str(db_user.id),
        "role": db_user.role,
        "email": db_user.email  
    }
    
    access_token = create_access_token(payload, access_token_expires)
    refresh_token = create_access_token(payload, refresh_token_expires)
    
    # Set cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="none" if IS_PRODUCTION else "lax",
        max_age=10800,
        path="/"
    )
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="none" if IS_PRODUCTION else "lax",
        max_age=604800,
        path="/"
    )
    
    # Format full name using decrypted values
    full_name = f"{decrypted_last_name}, {decrypted_first_name}"
    if decrypted_middle_name:
        full_name = f"{decrypted_last_name}, {decrypted_first_name} {decrypted_middle_name[0]}."
    
    return {
        "message": "Login Successful",
        "id": db_user.id,
        "role": db_user.role,
        "must_change_password": db_user.must_change_password,
        "email": db_user.email,  
        "first_name": decrypted_first_name,
        "last_name": decrypted_last_name,
        "middle_name": decrypted_middle_name,
        "full_name": full_name
    }


@router.post("/refresh")
def refresh_token(request: Request, response: Response, db: Session = Depends(get_db)):
    """
    Refresh access token using refresh token from cookie
    """
    refresh_token = request.cookies.get("refresh_token")
    
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refresh token required"
        )
    
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
            
        user = db.query(Users).filter(Users.id == int(user_id)).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
            
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    # Create new access token
    new_payload = {
        "sub": str(user.id),
        "role": user.role,
        "email": user.email
    }
    
    new_access_token = create_access_token(
        data=new_payload,
        expires_delta=timedelta(minutes=30)
    )

    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="none" if IS_PRODUCTION else "lax",
        max_age=3600,
        path="/"
    )

    return {
        "message": "Token refreshed successfully",
        "access_token": new_access_token,
        "token_type": "bearer"
    }


@router.post("/logout")
def logout(response: Response):
    """
    Clear authentication cookies
    """
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    
    return {"message": "Logout successful"}


@router.get("/me")
def get_current_user_info(current_user: Users = Depends(get_current_user)):
    """
    Get current logged-in user info with decrypted names
    """
    # Decrypt names for response
    try:
        decrypted_first_name = decrypt_data(current_user.first_name) if current_user.first_name else None
        decrypted_last_name = decrypt_data(current_user.last_name) if current_user.last_name else None
    except Exception as e:
        print(f"Decryption error in /me endpoint: {e}")
        decrypted_first_name = "[Decryption Error]"
        decrypted_last_name = "[Decryption Error]"
    
    return {
        "id": current_user.id,
        "email": current_user.email,  
        "role": current_user.role,
        "first_name": decrypted_first_name,  
        "last_name": decrypted_last_name,    
        "must_change_password": current_user.must_change_password
    }
    
    

