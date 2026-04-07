from pydantic import BaseModel

class OrderCreate(BaseModel):
    items: str
    total: float
    table_number: str # Added Table Field
    status: str

class ExpenseCreate(BaseModel):
    description: str
    amount: float