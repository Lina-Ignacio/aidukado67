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
    schedule = Column(String, nullable=False)
    
    room = Column(String(50), nullable=True)  
    section = Column(String(10), nullable=True)  
    #academic_year = Column(String(9), nullable=True)  
    #semester = Column(String(20), nullable=True)  
    academic_semester_id = Column(Integer, ForeignKey("academic_semester_year.id", ondelete="SET NULL"), nullable=True)                                                        
    
    lecture_units = Column(Integer, nullable=False, default=0)
    lab_units = Column(Integer, nullable=False, default=0)
    
    subject = relationship("Subject", back_populates="classes")
    user_teacher = relationship("Users", back_populates="classes_")
    class_students = relationship("ClassEnrollment", back_populates="enrolled_class")
    materials = relationship("ClassMaterial", back_populates="class_")
    quiz = relationship("Quiz", back_populates="classes")
    exams = relationship("Exam", back_populates="classes", cascade="all, delete-orphan")
    academic_semester = relationship("AcademicSemesterYear", back_populates="classes")
    
    __table_args__ = (
        Index(
            "idx_classes_active", 
            "is_archive", 
            postgresql_where=(is_archive == False)
        ),
        Index("idx_classes_room", "room"),
        Index("idx_classes_section", "section"),
        # Index("idx_classes_academic_year", "academic_year"),
        # Index("idx_classes_semester", "semester"),
        # NEW INDEXES
        Index("idx_classes_lecture_units", "lecture_units"),
        Index("idx_classes_lab_units", "lab_units"),
    )