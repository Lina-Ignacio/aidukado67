import os
from dotenv import load_dotenv
from passlib.context import CryptContext 
from fastapi import Request, HTTPException, Depends, status
from jose import jwt, JWTError
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Users
from app.database import get_db
from cryptography.fernet import Fernet
# Load environment variables
load_dotenv()



def generate_key():
    fernet_key = Fernet.generate_key()
    print(f"Fernet key: {fernet_key.decode()}")
    return(fernet_key.decode())

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")


if not SECRET_KEY:
    
    print("Please make a secret key in env")



pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)
email_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=8)

# Password hashing functions
def hash_password(password: str) -> str:
    """Hash a password for storing"""

    if not password:
        raise ValueError("Password must not be empty")
    return pwd_context.hash(password)

def hash_email(email: str) -> str:
    """Hash email for storage and lookup"""
    if not email:
        raise ValueError("Email must not be empty")
    return email_context.hash(email.lower())



if not ENCRYPTION_KEY:
    print("Please make an encryption key in env")

try:
    key = ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY
    cipher = Fernet(key)
except Exception as e:
    raise ValueError(f"Invalid ENCRYPTION_KEY format: {e}")

# Encrypt and Decrypt functions
def encrypt_data(data: str) -> str:
    """Encrypt personal data for storage"""
    if not data:
        return None
    try:
        
        encrypted = cipher.encrypt(data.encode())
        return encrypted.decode()
    except Exception as e:
        print(f"Encryption error: {e}")
        raise ValueError("Failed to encrypt data")

def decrypt_data(encrypted_data: str) -> str:
    """Decrypt personal data for display"""
    if not encrypted_data:
        return None
    try:
        # Convert from string, decrypt, then back to string
        decrypted = cipher.decrypt(encrypted_data.encode())
        return decrypted.decode()
    except Exception as e:
        print(f"Decryption error: {e}")
        raise ValueError("Failed to decrypt data")
    

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a stored password against a provided password"""
    return pwd_context.verify(plain_password, hashed_password)

# JWT token functions
def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
        
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str):
    """Decode a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


# Authentication dependency
def get_current_user(request: Request, db: Session = Depends(get_db)):
    """Get current authenticated user from JWT token"""
    # 1. Look for the access_token in the HTTP-only cookie
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
    
    # 3. Fetch user from database
    user = db.query(Users).filter(Users.id == int(user_id)).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="User not found"
        )
    
    # 4. Check if user is archived
    if user.is_archive:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated"
        )
        
    return user