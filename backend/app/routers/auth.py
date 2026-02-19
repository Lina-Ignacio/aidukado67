from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from datetime import timedelta
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from app.models.users import Users
from app.schemas.user import UserCreate, UserResponse, UserLogin, TokenResponse, UserSignup
from app.database import get_db
from app.utils.auth import hash_password, verify_password, create_access_token, get_current_user, hash_email, encrypt_data, decrypt_data
from app.config import SECRET_KEY, ALGORITHM
import os

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
        first_name=user.first_name,
        last_name=user.last_name,
        must_change_password=True
    )
        
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user


@router.post("/login")
def login(user: UserLogin, response: Response, db: Session = Depends(get_db)):
    #hashed_email = hash_email(user.email.lower())
    db_user = db.query(Users).filter(Users.email == user.email.lower()).first()

    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
        
    if db_user.is_archive:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated. Please contact administration."
        )
        
    if not verify_password(user.password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    access_token_expires = timedelta(minutes=30)
    refresh_token_expires = timedelta(days=7)

    payload = {
        "sub": str(db_user.id),   
        "role": db_user.role,
        "email": db_user.email
    }

    access_token = create_access_token(payload, access_token_expires)
    refresh_token = create_access_token(payload, refresh_token_expires)

    # Set access token cookie (30 minutes)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=IS_PRODUCTION,  
        samesite="none" if IS_PRODUCTION else "lax",
        max_age=1800,  
        path="/"
    )

    # Set refresh token cookie (7 days)
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="none" if IS_PRODUCTION else "lax",
        max_age=604800,  
        path="/"
    )

    return {
        "message": "Login Successful",
        "id": db_user.id,
        "role": db_user.role,
        "must_change_password": db_user.must_change_password,
        "email": db_user.email,
        "first_name": db_user.first_name
    }

@router.post("/refresh")
def refresh_token(request: Request, response: Response, db: Session = Depends(get_db)):
    """
    Refresh access token using refresh token from cookie
    """
    # Get refresh token from cookie
    refresh_token = request.cookies.get("refresh_token")
    
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refresh token required"
        )
    
    try:
        # Decode the refresh token
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
            
        # Get user from database
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

    # FIXED: Set the new access token cookie with proper settings
    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="none" if IS_PRODUCTION else "lax",
        max_age=1800,
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
    Get current logged-in user info
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "must_change_password": current_user.must_change_password
    }


@router.get("/migrate-user-data", status_code=status.HTTP_200_OK)
async def migrate_user_data(db: Session = Depends(get_db)):
    """
    ONE-TIME MIGRATION ROUTE: Hash emails/passwords and encrypt personal data for existing users.
    This route checks each field to avoid double-processing.
    DELETE THIS ROUTE AFTER USE!
    """
    try:
        # Get all users
        users = db.query(Users).all()
        
        migration_results = {
            "total_users": len(users),
            "updated_users": 0,
            "skipped_users": 0,
            "fields_updated": {
                "email_hashed": 0,
                "password_hashed": 0,
                "first_name_encrypted": 0,
                "last_name_encrypted": 0,
                "middle_name_encrypted": 0
            },
            "details": []
        }
        
        for user in users:
            user_updated = False
            user_details = {
                "id": user.id,
                "original_email": user.email,  # For reference only
                "updates": []
            }
            
            # Helper function to check if string is already hashed (bcrypt)
            def is_bcrypt_hashed(value):
                return value and value.startswith('$2b$')
            
            # Helper function to check if string is encrypted (Fernet)
            def is_encrypted(value):
                if not value:
                    return False
                # Fernet tokens are base64 encoded and have a specific format
                # They're typically 44 characters for the key + payload
                try:
                    # Try to decrypt - if it works, it was encrypted
                    decrypt_data(value)
                    return True
                except:
                    return False
            
            # Check and hash email if needed
            if user.email and not is_bcrypt_hashed(user.email):
                try:
                    # Store original email temporarily if needed for rollback
                    original_email = user.email
                    
                    # Hash the email
                    hashed_email = hash_email(user.email)
                    user.email = hashed_email
                    
                    migration_results["fields_updated"]["email_hashed"] += 1
                    user_details["updates"].append({
                        "field": "email",
                        "action": "hashed",
                        "original": original_email[:10] + "..."  # Log only partial for privacy
                    })
                    user_updated = True
                except Exception as e:
                    user_details["updates"].append({
                        "field": "email",
                        "error": str(e)
                    })
            
            # Check and hash password if needed (WARNING: Only if passwords are plain text!)
            if user.password_hash and not is_bcrypt_hashed(user.password_hash):
                try:
                    # This assumes password_hash currently contains plain text
                    # Only run this if you're sure passwords are in plain text!
                    hashed_password = hash_password(user.password_hash)
                    user.password_hash = hashed_password
                    
                    migration_results["fields_updated"]["password_hashed"] += 1
                    user_details["updates"].append({
                        "field": "password",
                        "action": "hashed"
                    })
                    user_updated = True
                except Exception as e:
                    user_details["updates"].append({
                        "field": "password",
                        "error": str(e)
                    })
            
            # Check and encrypt first_name if needed
            if user.first_name and not is_encrypted(user.first_name):
                try:
                    encrypted_first_name = encrypt_data(user.first_name)
                    user.first_name = encrypted_first_name
                    
                    migration_results["fields_updated"]["first_name_encrypted"] += 1
                    user_details["updates"].append({
                        "field": "first_name",
                        "action": "encrypted"
                    })
                    user_updated = True
                except Exception as e:
                    user_details["updates"].append({
                        "field": "first_name",
                        "error": str(e)
                    })
            
            # Check and encrypt last_name if needed
            if user.last_name and not is_encrypted(user.last_name):
                try:
                    encrypted_last_name = encrypt_data(user.last_name)
                    user.last_name = encrypted_last_name
                    
                    migration_results["fields_updated"]["last_name_encrypted"] += 1
                    user_details["updates"].append({
                        "field": "last_name",
                        "action": "encrypted"
                    })
                    user_updated = True
                except Exception as e:
                    user_details["updates"].append({
                        "field": "last_name",
                        "error": str(e)
                    })
            
            # Check and encrypt middle_name if needed
            if user.middle_name and not is_encrypted(user.middle_name):
                try:
                    encrypted_middle_name = encrypt_data(user.middle_name)
                    user.middle_name = encrypted_middle_name
                    
                    migration_results["fields_updated"]["middle_name_encrypted"] += 1
                    user_details["updates"].append({
                        "field": "middle_name",
                        "action": "encrypted"
                    })
                    user_updated = True
                except Exception as e:
                    user_details["updates"].append({
                        "field": "middle_name",
                        "error": str(e)
                    })
            
            # Save if any updates were made
            if user_updated:
                db.add(user)
                migration_results["updated_users"] += 1
                migration_results["details"].append(user_details)
            else:
                migration_results["skipped_users"] += 1
                user_details["updates"].append({"message": "No updates needed - all fields already processed"})
                migration_results["details"].append(user_details)
        
        # Commit all changes
        db.commit()
        
        return {
            "message": "Migration completed successfully",
            "results": migration_results,
            "warning": "⚠️ DELETE THIS ROUTE IMMEDIATELY AFTER CONFIRMING SUCCESSFUL MIGRATION!",
            "next_steps": [
                "1. Test login with a migrated user",
                "2. Verify that encrypted data can be decrypted properly",
                "3. If everything works, DELETE this route",
                "4. If issues occur, restore from backup and review the migration logic"
            ]
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Migration failed: {str(e)}"
        )

@router.get("/check-user-data-status", status_code=status.HTTP_200_OK)
async def check_user_data_status(db: Session = Depends(get_db)):
    """
    Check the current status of user data to see what needs migration.
    This is a SAFE route that only reads data and doesn't modify anything.
    """
    try:
        users = db.query(Users).all()
        
        status_report = {
            "total_users": len(users),
            "summary": {
                "emails_hashed": 0,
                "emails_plain": 0,
                "passwords_hashed": 0,
                "passwords_plain": 0,
                "first_names_encrypted": 0,
                "first_names_plain": 0,
                "last_names_encrypted": 0,
                "last_names_plain": 0,
                "middle_names_encrypted": 0,
                "middle_names_plain": 0
            },
            "user_details": []
        }
        
        for user in users:
            user_status = {
                "id": user.id,
                "email_status": "unknown",
                "password_status": "unknown",
                "first_name_status": "unknown",
                "last_name_status": "unknown",
                "middle_name_status": "unknown"
            }
            
            # Check email (should be bcrypt hashed)
            if user.email:
                if user.email.startswith('$2b$'):
                    status_report["summary"]["emails_hashed"] += 1
                    user_status["email_status"] = "hashed"
                else:
                    status_report["summary"]["emails_plain"] += 1
                    user_status["email_status"] = "plain"
            
            # Check password (should be bcrypt hashed)
            if user.password_hash:
                if user.password_hash.startswith('$2b$'):
                    status_report["summary"]["passwords_hashed"] += 1
                    user_status["password_status"] = "hashed"
                else:
                    status_report["summary"]["passwords_plain"] += 1
                    user_status["password_status"] = "plain"
            
            # Check first_name (should be encrypted)
            if user.first_name:
                try:
                    decrypt_data(user.first_name)
                    status_report["summary"]["first_names_encrypted"] += 1
                    user_status["first_name_status"] = "encrypted"
                except:
                    status_report["summary"]["first_names_plain"] += 1
                    user_status["first_name_status"] = "plain"
            
            # Check last_name (should be encrypted)
            if user.last_name:
                try:
                    decrypt_data(user.last_name)
                    status_report["summary"]["last_names_encrypted"] += 1
                    user_status["last_name_status"] = "encrypted"
                except:
                    status_report["summary"]["last_names_plain"] += 1
                    user_status["last_name_status"] = "plain"
            
            # Check middle_name (should be encrypted)
            if user.middle_name:
                try:
                    decrypt_data(user.middle_name)
                    status_report["summary"]["middle_names_encrypted"] += 1
                    user_status["middle_name_status"] = "encrypted"
                except:
                    status_report["summary"]["middle_names_plain"] += 1
                    user_status["middle_name_status"] = "plain"
            
            status_report["user_details"].append(user_status)
        
        return status_report
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check data status: {str(e)}"
        )

@router.get("/test-decrypt/{user_id}", status_code=status.HTTP_200_OK)
async def test_decrypt_user_data(user_id: int, db: Session = Depends(get_db)):
    """
    TEST ROUTE: Decrypt and verify a specific user's data.
    Use this to confirm migration worked correctly.
    DELETE THIS ROUTE AFTER TESTING!
    """
    try:
        user = db.query(Users).filter(Users.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        decrypted_data = {
            "id": user.id,
            "email": user.email,  # Email is hashed, not encrypted, so can't decrypt
            "first_name": decrypt_data(user.first_name) if user.first_name else None,
            "last_name": decrypt_data(user.last_name) if user.last_name else None,
            "middle_name": decrypt_data(user.middle_name) if user.middle_name else None,
            "role": user.role,
            "is_archive": user.is_archive,
            "must_change_password": user.must_change_password
        }
        
        return {
            "message": "Data decrypted successfully",
            "user_data": decrypted_data,
            "warning": "DELETE THIS TEST ROUTE AFTER VERIFICATION"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to decrypt data: {str(e)}"
        )