from datetime import datetime
from typing import Optional
import uuid
from pydantic import BaseModel


class ExpenseLog(BaseModel):
    title: str
    description: Optional[str]
    amount: float | int
    currency_code: str
    created: Optional[datetime] = None
    updated: Optional[datetime] = None
    user_id: Optional[uuid.UUID] = None
    expense_id: int


class ExpenseLogRead(ExpenseLog):
    id: int
