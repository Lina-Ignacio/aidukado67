

from sqlalchemy import Column, Integer, Date, String, ForeignKey, Boolean, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class ClassEnrollment(Base):
    
    __tablename__ = "class_enrollment"
    
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    enrollment_date = Column(Date, server_default=func.current_date())
    status = Column(String, default="active")
    is_archive = Column(Boolean, nullable=False, default=False)
    
    student = relationship("Users", back_populates="class_enrollments")
    enrolled_class = relationship("Classes", back_populates="class_students")
    
    
    __table_args__ = (
        Index(
            "idx_enrollment_active", 
            "is_archive", 
            postgresql_where=(is_archive == False)
        ),
    )