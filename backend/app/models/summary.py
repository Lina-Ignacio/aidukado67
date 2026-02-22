from sqlalchemy import Column, Integer, String
from app.database import Base

class Summary(Base):
    __tablename__='lesson_summaries'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    lesson_id = Column(Integer)
    summary = Column(String)