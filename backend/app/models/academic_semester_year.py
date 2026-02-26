from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class AcademicSemesterYear(Base):
    __tablename__ = "academic_semester_year"
    
    id = Column(Integer, primary_key=True, index=True)
    academic_year = Column(String(50), nullable=False)
    semester = Column(String(50), nullable=False)
    current = Column(Boolean, nullable=False, default=False)
    is_archive = Column(Boolean, nullable=False, default=False)
    
    # Relationships
    classes = relationship("Classes", back_populates="academic_semester")
    
    # Indexes
    __table_args__ = (
        Index("idx_academic_year", "academic_year"),
        Index("idx_semester", "semester"),
        Index("idx_current", "current"),
        Index("idx_academic_year_semester", "academic_year", "semester"),
        UniqueConstraint("academic_year", "semester", name="unique_academic_semester"),
    )
    
    def __repr__(self):
        return f"{self.academic_year} - {self.semester}"