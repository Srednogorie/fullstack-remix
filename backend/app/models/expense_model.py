from contextlib import asynccontextmanager
from multiprocessing import parent_process
import uuid
from sqlalchemy import (
    Column, DateTime, ForeignKey, String, func, select, desc,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.config.database import mapper_registry, get_db_cm
from app.models.base import CreatedUpdateBase
from app import schemas
from app.utils.app_exceptions import AppException
from app.utils.service_result import ServiceResult


@mapper_registry.mapped
class Expense(CreatedUpdateBase):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(64))
    amount: Mapped[float]
    date = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("user.id"))
    user: Mapped["User"] = relationship(back_populates="expenses")  # noqa

    def __repr__(self):
        return f'Expense({self.id}, "{self.title}")'

    @classmethod
    async def create(cls, item: schemas.Expense) -> ServiceResult:
        db_context = asynccontextmanager(get_db_cm)
        async with db_context() as db:
            expense = cls(**item.model_dump())
            db.add(expense)
            await db.commit()

            if not expense:
                return ServiceResult(AppException.CreateObject())
            return ServiceResult(True)

    @classmethod
    async def get(cls, expense_id: int, user) -> ServiceResult:
        db_context = asynccontextmanager(get_db_cm)
        async with db_context() as db:
            q = select(cls).where(cls.id == expense_id, cls.user_id == user.id)
            expense = await db.scalar(q)
            if not expense:
                return ServiceResult(
                    AppException.GetObject({"expense_id": expense_id})
                )
            # if not product.public:
            #      return ServiceResult(AppException.ObjectRequiresAuth())
            return ServiceResult(expense)

    @classmethod
    async def get_all(cls, user) -> ServiceResult:
        db_context = asynccontextmanager(get_db_cm)
        async with db_context() as db:
            q = select(cls).where(
                cls.user_id == user.id
            ).order_by(desc(cls.id))
            return ServiceResult([x async for x in await db.stream_scalars(q)])

    @classmethod
    async def delete(cls, expense_id: int, user) -> ServiceResult:
        db_context = asynccontextmanager(get_db_cm)
        async with db_context() as db:
            q = select(cls).where(cls.id == expense_id, cls.user_id == user.id)
            expense = await db.scalar(q)
            if not expense:
                return ServiceResult(
                    AppException.GetObject({"expense_id": expense_id})
                )
            await db.delete(expense)
            await db.commit()
            return ServiceResult(True)

    @classmethod
    async def update(cls, expense_id, data, user) -> ServiceResult:
        db_context = asynccontextmanager(get_db_cm)
        async with db_context() as db:
            q = select(cls).where(cls.id == expense_id, cls.user_id == user.id)
            expense = await db.scalar(q)
            if not expense:
                return ServiceResult(
                    AppException.GetObject({"expense_id": expense_id})
                )
            for key, value in data.model_dump().items():
                setattr(expense, key, value)
            expense.user_id = user.id
            db.add(expense)
            await db.commit()
            # await db.refresh(expense)
            return ServiceResult(expense)
