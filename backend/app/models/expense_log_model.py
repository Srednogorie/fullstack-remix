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
class ExpenseLog(CreatedUpdateBase):
    __tablename__ = "expense_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(64))
    description: Mapped[Optional[str]] = mapped_column(String(200))
    amount: Mapped[float]
    currency_code: Mapped[str] = mapped_column(String(10))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("user.id"))
    user: Mapped["User"] = relationship(back_populates="expense_logs")  # noqa
    expense_id: Mapped[int] = mapped_column(
        ForeignKey("expenses.id", ondelete="CASCADE")
    )
    expense: Mapped["Expense"] = relationship(back_populates="logs")  # noqa

    def __repr__(self):
        return f'ExpenseLog({self.id}, "{self.title}")'

    @classmethod
    async def create(cls, item: schemas.ExpenseLog) -> ServiceResult:
        db_context = asynccontextmanager(get_db_cm)
        async with db_context() as db:
            expense_log = cls(**item.model_dump())
            db.add(expense_log)
            await db.commit()

            if not expense_log:
                return ServiceResult(AppException.CreateObject())
            return ServiceResult(True)

    @classmethod
    async def get(cls, expense_log_id: int, user) -> ServiceResult:
        db_context = asynccontextmanager(get_db_cm)
        async with db_context() as db:
            q = select(cls).where(
                cls.id == expense_log_id, cls.user_id == user.id
            )
            expense_log = await db.scalar(q)
            if not expense_log:
                return ServiceResult(
                    AppException.GetObject({"expense_log_id": expense_log_id})
                )
            # if not product.public:
            #      return ServiceResult(AppException.ObjectRequiresAuth())
            return ServiceResult(expense_log)

    @classmethod
    async def get_all(cls, user, expense_id: int) -> ServiceResult:
        db_context = asynccontextmanager(get_db_cm)
        async with db_context() as db:
            q = select(cls).where(
                cls.user_id == user.id, cls.expense_id == expense_id
            ).order_by(desc(cls.id))
            return ServiceResult([x async for x in await db.stream_scalars(q)])

    @classmethod
    async def delete(cls, expense_id: int, user) -> ServiceResult:
        db_context = asynccontextmanager(get_db_cm)
        async with db_context() as db:
            q = select(cls).where(
                cls.expense_id == expense_id, cls.user_id == user.id
            )
            expense_logs = await db.scalar(q)
            if not expense_logs:
                return ServiceResult(
                    AppException.GetObject({"expense_id": expense_id})
                )
            await db.delete(expense_logs)
            await db.commit()
            return ServiceResult(True)

    @classmethod
    async def update(cls, expense_log_id, data, user) -> ServiceResult:
        db_context = asynccontextmanager(get_db_cm)
        async with db_context() as db:
            q = select(cls).where(
                cls.id == expense_log_id, cls.user_id == user.id
            )
            expense_log = await db.scalar(q)
            if not expense_log:
                return ServiceResult(
                    AppException.GetObject({"expense_log_id": expense_log_id})
                )
            for key, value in data.model_dump().items():
                setattr(expense_log, key, value)
            expense_log.user_id = user.id
            db.add(expense_log)
            await db.commit()
            # await db.refresh(expense_log)
            return ServiceResult(expense_log)
