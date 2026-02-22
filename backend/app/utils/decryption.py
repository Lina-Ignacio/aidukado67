from app.models import Users
from app.utils.auth import decrypt_data
from typing import Union, List, Optional
from fastapi import HTTPException, status
from app.models.classes import Classes

def decrypt_user(user: Users) -> Users:
    """
    Decrypt a single user's name fields in-place.
    Email is now plain text and NOT decrypted.
    
    Args:
        user: SQLAlchemy Users object
        
    Returns:
        The same Users object with decrypted name fields
    """
    if not user:
        return None
        
    try:
        # Email is now plain text - do NOT decrypt it!
        # if user.email:
        #     user.email = decrypt_data(user.email)  ← REMOVED
        
        if user.first_name:
            user.first_name = decrypt_data(user.first_name)
        if user.last_name:
            user.last_name = decrypt_data(user.last_name)
        if user.middle_name:
            user.middle_name = decrypt_data(user.middle_name)
        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to decrypt name data for user ID {user.id}: {str(e)}"
        )

def decrypt_users(users: List[Users]) -> List[Users]:
    """
    Decrypt multiple users' name fields.
    
    Args:
        users: List of SQLAlchemy Users objects
        
    Returns:
        List of Users objects with decrypted name fields
    """
    decrypted_users = []
    for user in users:
        try:
            decrypted_users.append(decrypt_user(user))
        except HTTPException as e:
            print(f"Skipping user {user.id} due to decryption error: {e.detail}")
            continue
    return decrypted_users

def decrypt_user_to_dict(user: Users) -> dict:
    """
    Decrypt a user's name fields and return as dictionary.
    Email is returned as-is (plain text).
    
    Args:
        user: SQLAlchemy Users object
        
    Returns:
        Dictionary with user data (email plain, names decrypted)
    """
    if not user:
        return None
        
    try:
        return {
            "id": user.id,
            "email": user.email,  # Plain text - no decryption
            "first_name": decrypt_data(user.first_name) if user.first_name else None,
            "last_name": decrypt_data(user.last_name) if user.last_name else None,
            "middle_name": decrypt_data(user.middle_name) if user.middle_name else None,
            "role": user.role,
            "is_archive": user.is_archive,
            "must_change_password": user.must_change_password,
            "created_at": user.created_at
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to decrypt name data for user ID {user.id}: {str(e)}"
        )

def decrypt_users_to_dict_list(users: List[Users]) -> List[dict]:
    """
    Decrypt multiple users' name fields and return as list of dictionaries.
    
    Args:
        users: List of SQLAlchemy Users objects
        
    Returns:
        List of dictionaries with user data (email plain, names decrypted)
    """
    return [decrypt_user_to_dict(user) for user in users if user]

def safe_decrypt_data(encrypted_data: str) -> str:
    """
    Safely decrypt data only if it appears to be encrypted.
    Returns the original value if:
    - It's None/empty
    - It doesn't look encrypted (doesn't start with 'gAAAAA')
    - Decryption fails
    """
    if not encrypted_data:
        return encrypted_data
    
    # Fernet encrypted strings always start with 'gAAAAA'
    if not encrypted_data.startswith('gAAAAA'):
        # This is likely plain text, return as-is
        return encrypted_data
    
    # Looks encrypted, try to decrypt
    try:
        return decrypt_data(encrypted_data)
    except Exception as e:
        print(f"Safe decryption failed for value starting with {encrypted_data[:20]}...: {e}")
        # Return original if decryption fails
        return encrypted_data


def safe_decrypt_user(user: Users) -> Users:
    """
    Safely decrypt a user's name fields without modifying the original object.
    Returns a new dict with decrypted values.
    """
    if not user:
        return None
    
    # Create a dictionary representation with decrypted fields
    return {
        "id": user.id,
        "email": user.email,  # Email is plain text
        "first_name": safe_decrypt_data(user.first_name),
        "last_name": safe_decrypt_data(user.last_name),
        "middle_name": safe_decrypt_data(user.middle_name),
        "role": user.role,
        "is_archive": user.is_archive,
        "must_change_password": user.must_change_password,
        "created_at": user.created_at
    }


def safe_decrypt_teacher(teacher: Users) -> dict:
    """
    Specifically for teacher data in enrollments.
    Returns a dict with decrypted teacher info.
    """
    if not teacher:
        return None
    
    return {
        "id": teacher.id,
        "email": teacher.email,
        "first_name": safe_decrypt_data(teacher.first_name),
        "last_name": safe_decrypt_data(teacher.last_name),
        "role": teacher.role
    }
    


def safe_decrypt_teacher_dict(teacher: Users) -> dict:
    """Convert teacher to dict with safely decrypted fields"""
    if not teacher:
        return None
    
    return {
        "id": teacher.id,
        "email": teacher.email,
        "first_name": safe_decrypt_data(teacher.first_name),
        "last_name": safe_decrypt_data(teacher.last_name),
        "middle_name": safe_decrypt_data(teacher.middle_name),
        "role": teacher.role,
        "is_archive": teacher.is_archive,
        "must_change_password": teacher.must_change_password,
        "created_at": teacher.created_at,
    }


def safe_decrypt_class_dict(class_item: Classes) -> dict:
    """Convert class to dict with safely decrypted teacher data"""
    if not class_item:
        return None
    
    class_dict = {
        "id": class_item.id,
        "subject_id": class_item.subject_id,
        "teacher_id": class_item.teacher_id,
        "name": class_item.name,
        "is_archive": class_item.is_archive,
        "schedule": class_item.schedule,
        "room": class_item.room,
        "section": class_item.section,
        "academic_year": class_item.academic_year,
        "semester": class_item.semester,
        "lecture_units": class_item.lecture_units,
        "lab_units": class_item.lab_units,
    }
    
    # Safely add teacher data
    if class_item.user_teacher:
        class_dict["user_teacher"] = safe_decrypt_teacher_dict(class_item.user_teacher)
    
    # Add subject data with the correct fields from your Subject model
    if class_item.subject:
        class_dict["subject"] = {
            "id": class_item.subject.id,
            "name": class_item.subject.name,
            "description": class_item.subject.description,
            "created_at": class_item.subject.created_at,
            "is_archive": class_item.subject.is_archive,
        }
    
    return class_dict