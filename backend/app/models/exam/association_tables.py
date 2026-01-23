
from sqlalchemy import Table, Column, Integer, ForeignKey
from app.database import Base


exam_class_materials = Table(
    'exam_class_materials',
    Base.metadata,
    Column('exam_id', Integer, ForeignKey('exams.id', ondelete="CASCADE"), primary_key=True),
    Column('class_material_id', Integer, ForeignKey('class_materials.id', ondelete="CASCADE"), primary_key=True)
)