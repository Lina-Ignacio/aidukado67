from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.database import get_db
from app.models.audit_log import AuditLog
from app.models.users import Users
from app.schemas.audit_log import AuditLogResponse

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

@router.get("/get", response_model=List[AuditLogResponse])
async def get_all_audit_logs(db: Session = Depends(get_db)):
    """
    Get all audit logs ordered by most recent first with user details
    """
    audit_logs = db.query(AuditLog)\
        .options(joinedload(AuditLog.user))\
        .order_by(AuditLog.changed_at.desc())\
        .all()
    
    # Manually ensure the user relationship is loaded
    for log in audit_logs:
        if log.changed_by and not log.user:
            # Force load the user if not loaded
            user = db.query(Users).filter(Users.id == log.changed_by).first()
            log.user = user
    
    return audit_logs