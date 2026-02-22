from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any

class UserInfo(BaseModel):
    id: int
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None

    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: int
    table_name: str
    record_id: Optional[str] = None
    operation_type: str
    changed_at: datetime
    changed_by: Optional[int] = None
    changed_by_user: Optional[UserInfo] = Field(None, alias="user") 
    original_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    changed_fields: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True
        populate_by_name = True  # Allows both alias and name to work