from sqlalchemy import Column, Integer, String, ForeignKey, JSON, DateTime, Index
from sqlalchemy.orm import relationship

from app.database import Base

class StudentQuizProgress(Base):
    __tablename__ = "student_quiz_progress"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), nullable=False, default="assigned") 
    score = Column(Integer, nullable=True)
    answers = Column(JSON, nullable=True)
    start_time = Column(DateTime(timezone=True))
    
    __table_args__ = (
        Index("idx_quiz_student", "quiz_id", "student_id"),
    )

    # Relationships
    student = relationship("Users", back_populates="quiz_progress")
    quiz = relationship("Quiz", back_populates="student_progress")