from sqlalchemy import Column, Integer, String, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func # Add this for server-side timestamps
from app.database import Base

class StudentQuizProgress(Base):
    __tablename__ = "student_quiz_progress"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), nullable=False, default="ongoing") # Defaults to ongoing
    score = Column(Integer, nullable=True)
    answers = Column(JSON, nullable=True)
    start_time = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    student = relationship("Users", back_populates="quiz_progress")
    quiz = relationship("Quiz", back_populates="student_progress")