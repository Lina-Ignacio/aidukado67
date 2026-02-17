from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Index, BigInteger
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.database import Base
from sqlalchemy.orm import relationship

class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    table_name = Column(String(100), nullable=False)
    record_id = Column(String(50), nullable=True)  # ID of the changed record
    operation_type = Column(String(10), nullable=False)  # INSERT, UPDATE, DELETE
    changed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    changed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    original_values = Column(JSONB, nullable=True)  # Values before change
    new_values = Column(JSONB, nullable=True)       # Values after change
    changed_fields = Column(JSONB, nullable=True)   # Only changed fields (for updates)

    

    # Relationships
    user = relationship("Users", foreign_keys=[changed_by], back_populates="audit_logs")

    # Indexes for better query performance
    __table_args__ = (
        Index('idx_audit_log_table_name', 'table_name'),
        Index('idx_audit_log_changed_by', 'changed_by'),
        Index('idx_audit_log_changed_at', 'changed_at'),
        Index('idx_audit_log_record_id', 'record_id'),
        Index('idx_audit_log_operation', 'operation_type'),
    )

    def __repr__(self):
        return f"<AuditLog {self.table_name}:{self.record_id} {self.operation_type} by {self.changed_by}>"

    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'id': self.id,
            'table_name': self.table_name,
            'record_id': self.record_id,
            'operation_type': self.operation_type,
            'changed_at': self.changed_at.isoformat() if self.changed_at else None,
            'changed_by': self.changed_by,
            'changed_by_username': self.user.username if self.user else None,
            'original_values': self.original_values,
            'new_values': self.new_values,
            'changed_fields': self.changed_fields,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent
        }