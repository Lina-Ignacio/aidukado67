from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models import Users, ClassEnrollment
from app.schemas.user import UserCreate, UserOut, UserUpdate, TeacherOut, PasswordChangeRequest
from app.database import SessionLocal
from app.utils.auth import hash_password, get_current_user
from app.schemas.user import AdminPasswordReset 
from app.database import get_db

router = APIRouter(prefix="/user", tags=["User"])


router = APIRouter(prefix="/user", tags=["user"])




@router.get("/get", response_model=list[UserOut])
def get_users(query: str | None = None, db: Session = Depends(get_db)):
    
    users_query = db.query(Users).filter(Users.is_archive == False)
    
    if query:
        users_query = users_query.filter(
            or_(
                Users.first_name.ilike(f"%{query}%"),
                Users.last_name.ilike(f"%{query}%"),
                Users.email.ilike(f"%{query}%")
            )
        )
        
    users= users_query.order_by(Users.id.asc()).all()

    return users


@router.get("/getById/{user_id}", response_model=UserOut)
def get_user_by_id(user_id: int , db: Session = Depends(get_db)):
    user = db.query(Users).filter(Users.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="user not found")
        
    return user

@router.get("/get_teachers", response_model=list[TeacherOut])
def get_all_teachers(db: Session = Depends(get_db)):
    teachers = db.query(Users).filter(
        Users.role == "teacher",
        Users.is_archive == False
    ).all()
    
    return teachers

@router.get("/get_students", response_model=list[UserOut])
def get_all_students(db: Session = Depends(get_db)):
    students = db.query(Users).filter(
        Users.role == "student",
        Users.is_archive == False
    ).all()
    
    return students



@router.post("/batch_create")
def create_multiple_users(users: list[UserCreate], db: Session = Depends(get_db)):
    try:
        
        incoming_emails = [u.email.lower() for u in users]
        
        
        existing_emails = db.query(Users.email).filter(Users.email.in_(incoming_emails)).all()
        existing_emails_set = {e[0] for e in existing_emails}

        if existing_emails_set:
            raise HTTPException(
                status_code=400, 
                detail=f"The following emails are already registered: {', '.join(existing_emails_set)}"
            )

        new_users_list = []
        for user in users:
            new_users_list.append(Users(
                last_name=user.last_name,
                first_name=user.first_name,
                middle_name=user.middle_name,
                email=user.email.lower(),
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
    
    existing_user = db.query(Users).filter(Users.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )

    hashed_pass = hash_password(user.password)

    
    new_user = Users(
        last_name = user.last_name,
        first_name = user.first_name,
        middle_name = user.middle_name,
        email = user.email.lower(),  
        password_hash = hashed_pass,
        role = user.role,
        must_change_password = True
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
    
    for key, value in user_update.dict(exclude_unset=True).items():
        setattr(user, key, value)
        
    db.commit()
    db.refresh(user)

    return {"message" : f"user with {user_id} updated successfully"}




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


