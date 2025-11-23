from sqlalchemy import Integer, DateTime, Column, ForeignKey
from sqlalchemy.sql import func
from app.database import Base
from sqlalchemy.orm import relationship

class StartTime(Base):
    __tablename__= 'quiz_attempts'

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey('quizzes.id'))
    student_id = Column(Integer)
    start_time = Column(DateTime(timezone=True), server_default=func.now())

    quiz = relationship('Quiz', back_populates='attempts')