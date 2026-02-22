
from sqlalchemy import Index, Column, ForeignKey, Integer, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class StudentExamReopen(Base):
    """Tracks which students can retake exams after the deadline"""
    __tablename__ = "student_exam_reopens"
    
    id = Column(Integer, primary_key=True)
    
    exam_id = Column(Integer, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    new_closing_time = Column(DateTime(timezone=True), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        
        Index('idx_reopen_exam_student', 'exam_id', 'student_id'),
        Index('idx_reopen_deadline', 'new_closing_time'),
        Index('idx_reopen_student', 'student_id'),
        UniqueConstraint('exam_id', 'student_id', name='uq_exam_student_reopen'),
    )
    
    # Relationships
    exam = relationship("Exam", back_populates="student_reopens")
    student = relationship("Users", back_populates="exam_reopens")