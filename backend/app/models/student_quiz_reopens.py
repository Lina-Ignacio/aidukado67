from sqlalchemy import Index, Column, ForeignKey, Integer, DateTime, String, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class StudentQuizReopen(Base):
    """Tracks which students can retake quizzes after the deadline"""
    __tablename__ = "student_quiz_reopens"
    
    id = Column(Integer, primary_key=True)
    
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    new_closing_time = Column(DateTime(timezone=True), nullable=False)
    reason = Column(String(500), nullable=True)  
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index('idx_quiz_reopen_quiz_student', 'quiz_id', 'student_id'),
        Index('idx_quiz_reopen_deadline', 'new_closing_time'),
        Index('idx_quiz_reopen_student', 'student_id'),
        Index('idx_quiz_reopen_reason', 'reason'),  
        UniqueConstraint('quiz_id', 'student_id', name='uq_quiz_student_reopen'),
    )
    
    # Relationships
    quiz = relationship("Quiz", back_populates="student_reopens")
    student = relationship("Users", back_populates="quiz_reopens")