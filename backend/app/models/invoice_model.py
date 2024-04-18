import uuid
from contextlib import asynccontextmanager
from multiprocessing import parent_process
from typing import Optional

from app import schemas
from app.config.database import get_db_cm, mapper_registry
from app.models.base import CreatedUpdateBase
from app.utils.app_exceptions import AppException
from app.utils.service_result import ServiceResult
from fastapi_pagination.ext.sqlalchemy import paginate
from sqlalchemy import Column, DateTime, ForeignKey, String, desc, func, select
from sqlalchemy.orm import Mapped, mapped_column, relationship


@mapper_registry.mapped
class Invoice(CreatedUpdateBase):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(64))
    description: Mapped[Optional[str]] = mapped_column(String(200))
    amount: Mapped[float]
    currency_code: Mapped[str] = mapped_column(String(10))
    attachment: Mapped[Optional[str]] = mapped_column(String(200))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("user.id"))
    user: Mapped["User"] = relationship(back_populates="invoices")  # noqa
    logs: Mapped[list["InvoiceLog"]] = relationship(  # noqa
        back_populates="invoice",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self):
        return f'Invoice({self.id}, "{self.title}")'

    @classmethod
    async def create(cls, item: schemas.Invoice) -> ServiceResult:
        db_context = asynccontextmanager(get_db_cm)
        async with db_context() as db:
            invoice = cls(**item.model_dump())
            db.add(invoice)
            await db.commit()

            if not invoice:
                return ServiceResult(AppException.CreateObject())
            return ServiceResult(invoice)

    @classmethod
    async def get(cls, invoice_id: int, user) -> ServiceResult:
        db_context = asynccontextmanager(get_db_cm)
        async with db_context() as db:
            q = select(cls).where(cls.id == invoice_id, cls.user_id == user.id)
            invoice = await db.scalar(q)
            if not invoice:
                return ServiceResult(
                    AppException.GetObject({"invoice_id": invoice_id})
                )
            # if not product.public:
            #      return ServiceResult(AppException.ObjectRequiresAuth())
            return ServiceResult(invoice)

    @classmethod
    async def first(cls, user) -> ServiceResult:
        db_context = asynccontextmanager(get_db_cm)
        async with db_context() as db:
            q = select(cls).where(cls.user_id == user.id)
            invoice = await db.scalar(q)
            if not invoice:
                return ServiceResult(
                    AppException.GetObject({"user_id": "No invoices found"})
                )
            # if not product.public:
            #      return ServiceResult(AppException.ObjectRequiresAuth())
            return ServiceResult(invoice)

    @classmethod
    async def get_all(cls, user) -> ServiceResult:
        db_context = asynccontextmanager(get_db_cm)
        async with db_context() as db:
            q = select(cls).where(
                cls.user_id == user.id
            ).order_by(desc(cls.id))
            res = await paginate(db, q)
            return ServiceResult(res)
            # TODO: implement streaming connection
            # return ServiceResult([x async for x in await db.stream_scalars(q)])

    @classmethod
    async def delete(cls, invoice_id: int, user) -> ServiceResult:
        db_context = asynccontextmanager(get_db_cm)
        async with db_context() as db:
            q = select(cls).where(cls.id == invoice_id, cls.user_id == user.id)
            invoice = await db.scalar(q)
            if not invoice:
                return ServiceResult(
                    AppException.GetObject({"invoice_id": invoice_id})
                )
            await db.delete(invoice)
            await db.commit()
            return ServiceResult(True)

    @classmethod
    async def update(cls, invoice_id, data, user) -> ServiceResult:
        db_context = asynccontextmanager(get_db_cm)
        async with db_context() as db:
            q = select(cls).where(cls.id == invoice_id, cls.user_id == user.id)
            invoice = await db.scalar(q)
            if not invoice:
                return ServiceResult(
                    AppException.GetObject({"invoice_id": invoice_id})
                )
            for key, value in data.model_dump().items():
                setattr(invoice, key, value)
            invoice.user_id = user.id
            db.add(invoice)

            await db.flush()
            await db.refresh(invoice)
            return ServiceResult(invoice)
