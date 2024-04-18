import uuid
from contextlib import asynccontextmanager
from multiprocessing import parent_process
from typing import Optional

from app import schemas
from app.config.database import get_db_cm, mapper_registry
from app.models.base import CreatedUpdateBase
from app.utils.app_exceptions import AppException
from app.utils.service_result import ServiceResult
from sqlalchemy import Column, DateTime, ForeignKey, String, desc, func, select
from sqlalchemy.orm import Mapped, mapped_column, relationship


@mapper_registry.mapped
class InvoiceLog(CreatedUpdateBase):
    __tablename__ = "invoice_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(64))
    description: Mapped[Optional[str]] = mapped_column(String(200))
    amount: Mapped[float]
    currency_code: Mapped[str] = mapped_column(String(10))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("user.id"))
    user: Mapped["User"] = relationship(back_populates="invoice_logs")  # noqa
    invoice_id: Mapped[int] = mapped_column(
        ForeignKey("invoices.id", ondelete="CASCADE")
    )
    invoice: Mapped["Invoice"] = relationship(back_populates="logs")  # noqa

    def __repr__(self):
        return f'InvoiceLog({self.id}, "{self.title}")'

    @classmethod
    async def create(cls, item: schemas.InvoiceLog) -> ServiceResult:
        db_context = asynccontextmanager(get_db_cm)
        async with db_context() as db:
            invoice_log = cls(**item.model_dump())
            db.add(invoice_log)
            await db.commit()

            if not invoice_log:
                return ServiceResult(AppException.CreateObject())
            return ServiceResult(True)

    @classmethod
    async def get(cls, invoice_log_id: int, user) -> ServiceResult:
        db_context = asynccontextmanager(get_db_cm)
        async with db_context() as db:
            q = select(cls).where(
                cls.id == invoice_log_id, cls.user_id == user.id
            )
            invoice_log = await db.scalar(q)
            if not invoice_log:
                return ServiceResult(
                    AppException.GetObject({"invoice_log_id": invoice_log_id})
                )
            # if not product.public:
            #      return ServiceResult(AppException.ObjectRequiresAuth())
            return ServiceResult(invoice_log)

    @classmethod
    async def get_all(cls, user, invoice_id: int) -> ServiceResult:
        db_context = asynccontextmanager(get_db_cm)
        async with db_context() as db:
            q = select(cls).where(
                cls.user_id == user.id, cls.invoice_id == invoice_id
            ).order_by(desc(cls.id))
            return ServiceResult([x async for x in await db.stream_scalars(q)])

    @classmethod
    async def delete(cls, invoice_log_id: int, user) -> ServiceResult:
        db_context = asynccontextmanager(get_db_cm)
        async with db_context() as db:
            q = select(cls).where(
                cls.id == invoice_log_id, cls.user_id == user.id
            )
            invoice_log = await db.scalar(q)
            if not invoice_log:
                return ServiceResult(
                    AppException.GetObject({"invoice_log_id": invoice_log_id})
                )
            await db.delete(invoice_log)
            await db.commit()
            return ServiceResult(True)

    @classmethod
    async def update(cls, invoice_log_id, data, user) -> ServiceResult:
        db_context = asynccontextmanager(get_db_cm)
        async with db_context() as db:
            q = select(cls).where(
                cls.id == invoice_log_id, cls.user_id == user.id
            )
            invoice_log = await db.scalar(q)
            if not invoice_log:
                return ServiceResult(
                    AppException.GetObject({"invoice_log_id": invoice_log_id})
                )
            for key, value in data.model_dump().items():
                setattr(invoice_log, key, value)
            invoice_log.user_id = user.id
            db.add(invoice_log)
            await db.commit()
            # await db.refresh(invoice_log)
            return ServiceResult(invoice_log)
