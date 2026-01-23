
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from app.models.exam.association_tables import exam_class_materials

class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    total_points = Column(Integer, nullable=False)
    instructions = Column(String(1000), nullable=True)
    exam_content = Column(JSON, nullable=False)
    duration = Column(Integer, nullable=False)  # Duration in minutes
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    term_id = Column(Integer, ForeignKey("terms.id", ondelete="CASCADE"), nullable=False)
    is_archive = Column(Boolean, default=False)
    passing_score = Column(Integer, nullable=True)  # Optional passing score
    shuffle_questions = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    __table_args__ = (
        Index("idx_exam_class", "class_id"),
        Index("idx_exam_term", "term_id"),
        Index("idx_exam_created", "created_at"),
    )

    # Relationships
    student_progress = relationship("StudentExamProgress", back_populates="exam", cascade="all, delete-orphan")
    classes = relationship("Classes", back_populates="exams")
    term = relationship("Term", back_populates="exams")
    
    # Many-to-many relationship with class_materials
    class_materials = relationship(
        "ClassMaterial",
        secondary="exam_class_materials",
        back_populates="exams"
    )
    
    