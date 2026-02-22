from sqlalchemy import Index, Column, ForeignKey, Integer, DateTime, String, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class StudentTaskReopen(Base):
    """Tracks which students can submit tasks after the original deadline"""
    __tablename__ = "student_task_reopens"
    
    id = Column(Integer, primary_key=True)
    material_id = Column(Integer, ForeignKey("class_materials.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    new_due_date = Column(DateTime(timezone=True), nullable=False)
    reason = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    __table_args__ = (
        
        Index('student_task_reopens_mat_stu_idx', 'material_id', 'student_id'),
        
        Index('student_task_reopens_due_date_idx', 'new_due_date'),
        
        Index('student_task_reopens_student_idx', 'student_id'),
        
        UniqueConstraint('material_id', 'student_id', name='uq_material_student_reopen'),
    )
    
    # Relationships
    material = relationship("ClassMaterial", back_populates="student_reopens")
    student = relationship("Users", back_populates="task_reopens")