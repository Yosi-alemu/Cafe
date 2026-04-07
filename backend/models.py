from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base
import datetime

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    items = Column(String)
    total = Column(Float)
    table_number = Column(String) # Added Table Column
    status = Column(String, default="pending")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    description = Column(String)
    amount = Column(Float)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)