
from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Index
from sqlalchemy.orm import relationship
from app.database import Base

    
class Classes(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    is_archive = Column(Boolean, nullable=False, default=False)

    
    subject = relationship("Subject", back_populates="classes")

    user_teacher = relationship("Users", back_populates="classes_")
    class_students = relationship("ClassEnrollment", back_populates="enrolled_class")
    materials = relationship("ClassMaterial", back_populates="class_")
    quiz = relationship("Quiz", back_populates="classes" )
    exams = relationship("Exam", back_populates="classes", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index(
            "idx_classes_active", 
            "is_archive", 
            postgresql_where=(is_archive == False)
        ),
    )