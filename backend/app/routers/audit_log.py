from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.database import get_db
from app.models.audit_log import AuditLog
from app.models.users import Users
from app.schemas.audit_log import AuditLogResponse
from app.utils.decryption import safe_decrypt_data, safe_decrypt_user 

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

@router.get("/get", response_model=List[AuditLogResponse])
async def get_all_audit_logs(db: Session = Depends(get_db)):
    """
    Get all audit logs ordered by most recent first with safely decrypted user details
    """
    audit_logs = db.query(AuditLog)\
        .options(joinedload(AuditLog.user))\
        .order_by(AuditLog.changed_at.desc())\
        .all()
    
    
    for log in audit_logs:
        if log.changed_by and not log.user:
            # Force load the user if not loaded
            user = db.query(Users).filter(Users.id == log.changed_by).first()
            log.user = user
        
        # Safely decrypt user information if it exists
        if log.user:
            # Use safe decryption for name fields
            if log.user.first_name:
                log.user.first_name = safe_decrypt_data(log.user.first_name)
            if log.user.last_name:
                log.user.last_name = safe_decrypt_data(log.user.last_name)
            if log.user.middle_name:
                log.user.middle_name = safe_decrypt_data(log.user.middle_name)
    
    return audit_logs