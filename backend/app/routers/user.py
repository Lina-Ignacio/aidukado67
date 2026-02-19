from fastapi import APIRouter, Depends, HTTPException, Response, status
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.models import Users, ClassEnrollment
from app.schemas.user import UserCreate, UserOut, UserUpdate, TeacherOut, PasswordChangeRequest, StudentSimpleResponse, AdminPasswordReset, UserStatistics
from app.database import SessionLocal
from app.utils.auth import hash_password, get_current_user, encrypt_data, decrypt_data
from app.database import get_db
from app.utils.decryption import decrypt_user_to_dict, decrypt_users_to_dict_list

router = APIRouter(prefix="/user", tags=["User"])


@router.get("/get", response_model=list[UserOut])
def get_users(query: str | None = None, db: Session = Depends(get_db)):
    users = db.query(Users).filter(Users.is_archive == False).order_by(Users.created_at.desc()).all()
    
    # This correctly decrypts ONLY names, email stays plain
    decrypted_users = decrypt_users_to_dict_list(users)
    
    if query:
        query_lower = query.lower()
        decrypted_users = [
            u for u in decrypted_users 
            if (u["first_name"] and query_lower in u["first_name"].lower()) or
               (u["last_name"] and query_lower in u["last_name"].lower()) or
               (u["email"] and query_lower in u["email"].lower())
        ]
    
    return decrypted_users


@router.get("/getById/{user_id}", response_model=UserOut)
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    user = db.query(Users).filter(Users.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # This correctly decrypts ONLY names
    return decrypt_user_to_dict(user)


@router.get("/get_teachers", response_model=list[TeacherOut])
def get_all_teachers(db: Session = Depends(get_db)):
    teachers = db.query(Users).filter(
        Users.role == "teacher",
        Users.is_archive == False
    ).all()
    
    # Decrypt teacher data - ONLY names, email is plain text
    decrypted_teachers = []
    for teacher in teachers:
        decrypted_teacher = {
            "id": teacher.id,
            "email": teacher.email,  # Email is now plain text - no decryption needed
            "first_name": decrypt_data(teacher.first_name) if teacher.first_name else None,
            "last_name": decrypt_data(teacher.last_name) if teacher.last_name else None,
            "middle_name": decrypt_data(teacher.middle_name) if teacher.middle_name else None,
            "role": teacher.role,
            "is_archive": teacher.is_archive
        }
        decrypted_teachers.append(decrypted_teacher)
    
    return decrypted_teachers


@router.get("/get_students", response_model=list[UserOut])
def get_all_students(db: Session = Depends(get_db)):
    students = db.query(Users).filter(
        Users.role == "student",
        Users.is_archive == False
    ).all()
    
    # Decrypt students data using helper function
    return decrypt_users_to_dict_list(students)


@router.post("/batch_create")
def create_multiple_users(users: list[UserCreate], db: Session = Depends(get_db)):
    try:
        # Check for existing emails using plain text
        incoming_emails = [u.email.lower() for u in users]
        
        # Check for existing emails
        existing_users = db.query(Users.email).filter(Users.email.in_(incoming_emails)).all()
        if existing_users:
            raise HTTPException(
                status_code=400, 
                detail="One or more emails are already registered."
            )

        new_users_list = []
        for user in users:
            new_users_list.append(Users(
                last_name=encrypt_data(user.last_name),
                first_name=encrypt_data(user.first_name),
                middle_name=encrypt_data(user.middle_name) if user.middle_name else None,
                email=user.email.lower(),  # Store as plain text (lowercase)
                password_hash=hash_password(user.password),
                role=user.role,
                must_change_password=True
            ))
        
        db.add_all(new_users_list)
        db.commit()
        
        return {"message": f"{len(new_users_list)} Users Registered Successfully"}

    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="An unexpected error occurred during batch creation.")


@router.post("/create")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    
    # Check for existing email using plain text
    existing_user = db.query(Users).filter(Users.email == user.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )

    encrypted_last_name = encrypt_data(user.last_name)
    encrypted_first_name = encrypt_data(user.first_name)
    encrypted_middle_name = encrypt_data(user.middle_name) if user.middle_name else None
    hashed_pass = hash_password(user.password)
    
    new_user = Users(
        last_name=encrypted_last_name,
        first_name=encrypted_first_name,
        middle_name=encrypted_middle_name,
        email=user.email.lower(),  # Store as plain text (lowercase)
        password_hash=hashed_pass,
        role=user.role,
        must_change_password=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "User Created Successfully", "user_id": new_user.id}


@router.patch("/patch/{user_id}")
def patch_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(Users).filter(Users.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not existing")
    
    update_data = user_update.dict(exclude_unset=True)
    
    # Encrypt name fields if they're being updated
    if 'first_name' in update_data:
        update_data['first_name'] = encrypt_data(update_data['first_name'])
    if 'last_name' in update_data:
        update_data['last_name'] = encrypt_data(update_data['last_name'])
    if 'middle_name' in update_data and update_data['middle_name']:
        update_data['middle_name'] = encrypt_data(update_data['middle_name'])
    # Email is now plain text - no hashing/encryption needed
    # if 'email' in update_data:
    #     update_data['email'] = update_data['email'].lower()  # Just lowercase, no hash
    
    for key, value in update_data.items():
        setattr(user, key, value)
        
    db.commit()
    db.refresh(user)

    return {"message": f"user with {user_id} updated successfully"}


@router.patch("/reset-password/{user_id}")
def admin_reset_password(
    user_id: int, 
    payload: AdminPasswordReset, 
    db: Session = Depends(get_db)
):
    
    user = db.query(Users).filter(Users.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.password_hash = hash_password(payload.new_password)
    user.must_change_password = True
    
    try:
        db.commit()
        db.refresh(user)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error occurred")

    return {"message": "Temporary password set. User must change it on next login."}


@router.patch("/change-password-first-login")
def change_password_first_login(
    payload: PasswordChangeRequest,
    response: Response,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized"
        )

    if not payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is required"
        )

    try:
        current_user = db.merge(current_user)
        
        current_user.password_hash = hash_password(payload.new_password)
        current_user.must_change_password = False

        db.commit()
        db.refresh(current_user)

        response.delete_cookie(
            key="access_token",
            path="/",
        )

        return {
            "message": "Security updated. Please log in again with your new password."
        }

    except Exception as e:
        db.rollback()
        print("CHANGE PASSWORD ERROR:", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update password in database."
        )


@router.patch("/archive/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(Users).filter(Users.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing_enrollments = db.query(ClassEnrollment).filter_by(student_id=user_id).first()
    if existing_enrollments:
        raise HTTPException(
            status_code=400,
            detail="Cannot archive user: existing enrollments found."
        )

    user.is_archive = True
    db.commit()
    db.refresh(user)
    return {"message": f"User with ID {user_id} archived successfully"}

@router.get("/{class_id}/students", response_model=List[StudentSimpleResponse])
async def get_students_by_class_id(
    class_id: int,
    db: Session = Depends(get_db)
):
    """
    Simple endpoint to get all students in a class.
    Returns list of students sorted by last name.
    """
    # Query students (no ORDER BY here)
    students = (
        db.query(Users)
        .join(ClassEnrollment, Users.id == ClassEnrollment.student_id)
        .filter(
            ClassEnrollment.class_id == class_id,
            Users.role == "student",
            Users.is_archive == False
        )
        .all()  # Remove .order_by()
    )
    
    if not students:
        return []
    
    # Format response with decrypted data
    result = []
    for student in students:
        # Decrypt name fields
        decrypted_first_name = decrypt_data(student.first_name) if student.first_name else ""
        decrypted_last_name = decrypt_data(student.last_name) if student.last_name else ""
        decrypted_middle_name = decrypt_data(student.middle_name) if student.middle_name else ""
        
        # Format full name
        middle_initial = ""
        if decrypted_middle_name:
            middle_initial = f" {decrypted_middle_name[0]}." if decrypted_middle_name.strip() else ""
        
        full_name = f"{decrypted_last_name}, {decrypted_first_name}{middle_initial}"
        
        result.append({
            "id": student.id,
            "full_name": full_name,
            "email": student.email,
            "first_name": decrypted_first_name,
            "last_name": decrypted_last_name,
            "_sort_key": decrypted_last_name.lower()  # Add sort key
        })
    
    # Sort in memory after decryption
    result.sort(key=lambda x: x["_sort_key"])
    
    # Remove sort key and return
    for item in result:
        del item["_sort_key"]
    
    return result


@router.get("/statistics", response_model=UserStatistics)
async def get_user_statistics(db: Session = Depends(get_db)):
    """
    Get user statistics counts for dashboard
    """
    try:
        # Get total users count (excluding archived)
        total_users = db.query(func.count(Users.id)).filter(
            Users.is_archive == False
        ).scalar() or 0
        
        # Get teachers count
        total_teachers = db.query(func.count(Users.id)).filter(
            Users.is_archive == False,
            Users.role == "teacher"
        ).scalar() or 0
        
        # Get students count
        total_students = db.query(func.count(Users.id)).filter(
            Users.is_archive == False,
            Users.role == "student"
        ).scalar() or 0
        
        # Get admins count
        total_admins = db.query(func.count(Users.id)).filter(
            Users.is_archive == False,
            Users.role == "admin"
        ).scalar() or 0
        
        return UserStatistics(
            total_users=total_users,
            total_teachers=total_teachers,
            total_students=total_students,
            total_admins=total_admins
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))