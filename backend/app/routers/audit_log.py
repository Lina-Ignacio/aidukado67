from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.database import get_db
from app.models.audit_log import AuditLog
from app.models.users import Users
from app.schemas.audit_log import AuditLogResponse
from app.utils.decryption import safe_decrypt_data

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
    
    # Transform the data to match the Pydantic model
    result = []
    for log in audit_logs:
        # Start with the basic log data
        log_dict = {
            "id": log.id,
            "table_name": log.table_name,
            "record_id": log.record_id,
            "operation_type": log.operation_type,
            "changed_at": log.changed_at,
            "changed_by": log.changed_by,
            "original_values": log.original_values,
            "new_values": log.new_values,
            "changed_fields": log.changed_fields,
        }
        
        # Add user info with alias "user" (maps to changed_by_user in schema)
        if log.user:
            # Decrypt user data
            first_name = safe_decrypt_data(log.user.first_name) if log.user.first_name else None
            last_name = safe_decrypt_data(log.user.last_name) if log.user.last_name else None
            
            log_dict["user"] = {  # This matches the alias="user" in your schema
                "id": log.user.id,
                "email": log.user.email,
                "first_name": first_name,
                "last_name": last_name
            }
        else:
            log_dict["user"] = None
        
        # Create the Pydantic model instance
        result.append(AuditLogResponse(**log_dict))
    
    return result