import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class Invoice(BaseModel):
    title: str
    description: Optional[str]
    amount: float | int
    currency_code: str
    attachment: Optional[str]
    created: Optional[datetime] = None
    updated: Optional[datetime] = None
    user_id: Optional[uuid.UUID] = None


class InvoiceUpdate(BaseModel):
    title: str
    description: Optional[str]
    amount: float | int
    attachment: Optional[str]


class InvoiceRead(Invoice):
    id: int
