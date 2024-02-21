from datetime import date
from typing import Optional
import uuid
from pydantic import BaseModel, ConfigDict

from app.models.user_model import User

# Think of a good way to describe CRUD


class Expense(BaseModel):
    title: str
    amount: float
    date: date
    user_id: Optional[uuid.UUID] = None


class ExpenseRead(Expense):
    id: int
    user_id: Optional[uuid.UUID]
