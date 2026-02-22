from sqlalchemy import Column, Integer, Text, ForeignKey, TIMESTAMP, func, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.database import Base

class LessonContent(Base):
    __tablename__ = "lesson_contents"

    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("class_materials.id", ondelete="CASCADE"), nullable=False)
    extracted_content = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    summary = Column(JSONB, nullable=True)

    material = relationship("ClassMaterial", back_populates="content")

    __table_args__ = (
        # Partial GIN index on summary (only non-NULL values)
        Index(
            'idx_lesson_contents_summary_gin',  # index name
            summary,  # column to index
            postgresql_using='gin',  # use GIN index
            postgresql_where=(summary != None)  # partial index: only non-NULL
        ),
        # Expression index for checking if summary exists
        Index(
            'idx_lesson_contents_has_summary',
            summary.isnot(None),  # expression: summary IS NOT NULL
            postgresql_where=(summary.isnot(None))
        ),
    )