from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class StudentExamProgress(Base):
    __tablename__ = "student_exam_progress"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    exam_id = Column(Integer, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), nullable=False, default="assigned")
    score = Column(Integer, nullable=True)  
    answers = Column(JSON, nullable=True)
    start_time = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    __table_args__ = (
        Index("idx_exam_student", "exam_id", "student_id"),
        Index("idx_exam_status", "exam_id", "status"),
    )

    
    student = relationship("Users", back_populates="exam_progress")
    exam = relationship("Exam", back_populates="student_progress")