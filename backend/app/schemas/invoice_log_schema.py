import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class InvoiceLog(BaseModel):
    title: str
    description: Optional[str]
    amount: float | int
    currency_code: str
    created: Optional[datetime] = None
    updated: Optional[datetime] = None
    user_id: Optional[uuid.UUID] = None
    invoice_id: int


class InvoiceLogRead(InvoiceLog):
    id: int
