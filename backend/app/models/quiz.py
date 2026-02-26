from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey, func, JSON, DateTime, Boolean
from app.database import Base
from sqlalchemy.orm import relationship


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("class_materials.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    total_points = Column(Integer)
    instructions = Column(Text, nullable=True)
    quiz_content = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now()) 
    duration = Column(Integer)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"))
    is_archive = Column(Boolean, default=False)
    assessment_type = Column(String(255), nullable=False)
    term_id = Column(Integer, ForeignKey("terms.id", ondelete="CASCADE"))
    opening_time = Column(DateTime(timezone=True), nullable=True)
    closing_time = Column(DateTime(timezone=True), nullable=True)
    show_answer = Column(Boolean, default=False)

    material = relationship("ClassMaterial", back_populates="quizzes")
    student_progress = relationship("StudentQuizProgress", back_populates="quiz")
    classes = relationship("Classes", back_populates="quiz")
    attempts = relationship('StartTime', back_populates='quiz')
    term = relationship('Term', back_populates = 'quiz')
    student_reopens = relationship("StudentQuizReopen", back_populates="quiz", cascade="all, delete-orphan")