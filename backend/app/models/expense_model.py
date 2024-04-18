import uuid
from contextlib import asynccontextmanager
from multiprocessing import parent_process
from typing import Optional

from app import schemas
from app.config.database import get_db_cm, mapper_registry
from app.models.base import CreatedUpdateBase
from app.utils.app_exceptions import AppException
from app.utils.aws import delete_user_file, upload_user_file
from app.utils.service_result import ServiceResult
from fastapi_pagination.ext.sqlalchemy import paginate
from pydantic import ValidationError
from sqlalchemy import Column, DateTime, ForeignKey, String, desc, func, select
from sqlalchemy.orm import Mapped, mapped_column, relationship


@mapper_registry.mapped
class Expense(CreatedUpdateBase):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(64))
    description: Mapped[Optional[str]] = mapped_column(String(200))
    amount: Mapped[float]
    currency_code: Mapped[str] = mapped_column(String(10))
    attachment: Mapped[Optional[str]] = mapped_column(String(200))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("user.id"))
    user: Mapped["User"] = relationship(back_populates="expenses")  # noqa
    logs: Mapped[list["ExpenseLog"]] = relationship(  # noqa
        back_populates="expense",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self):
        return f'Expense({self.id}, "{self.title}")'

    @classmethod
    async def create(
        cls, user, title, description, amount, attachment
    ) -> ServiceResult:
        url = None
        if attachment:
            url = upload_user_file(attachment, user.id)

        db_context = asynccontextmanager(get_db_cm)
        async with db_context() as db:
            expense = cls(
                title=title,
                description=description,
                amount=amount,
                attachment=url,
                currency_code="USD",
                user_id=user.id
            )
            db.add(expense)
            await db.commit()

            if not expense:
                return ServiceResult(AppException.CreateObject())
            return ServiceResult(expense)

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
    async def first(cls, user) -> ServiceResult:
        db_context = asynccontextmanager(get_db_cm)
        async with db_context() as db:
            q = select(cls).where(cls.user_id == user.id)
            expense = await db.scalar(q)
            if not expense:
                return ServiceResult(
                    AppException.GetObject({"user_id": "No expenses found"})
                )
            # if not product.public:
            #      return ServiceResult(AppException.ObjectRequiresAuth())
            return ServiceResult(expense)

    @classmethod
    async def get_all(cls, user, search_param) -> ServiceResult:
        db_context = asynccontextmanager(get_db_cm)
        async with db_context() as db:
            q = select(cls).where(
                cls.user_id == user.id
            ).order_by(desc(cls.id))
            if search_param:
                q = q.where(cls.title.ilike(f"%{search_param}%"))
            res = await paginate(db, q)
            return ServiceResult(res)
            # TODO: implement streaming connection
            # return ServiceResult([x async for x in await paginate(db.stream_scalars(q))])

    @classmethod
    async def delete(cls, expense_id: int, user) -> ServiceResult:
        db_context = asynccontextmanager(get_db_cm)
        async with db_context() as db:
            q = select(cls).where(cls.id == expense_id, cls.user_id == user.id)
            expense = await db.scalar(q)
            delete_user_file(f"{user.id}/{expense.attachment}")
            if not expense:
                return ServiceResult(
                    AppException.GetObject({"expense_id": expense_id})
                )
            await db.delete(expense)
            await db.commit()
            return ServiceResult(True)

    @classmethod
    async def delete_attachment(cls, expense_id: int, user) -> ServiceResult:
        db_context = asynccontextmanager(get_db_cm)
        async with db_context() as db:
            q = select(cls).where(cls.id == expense_id, cls.user_id == user.id)
            expense = await db.scalar(q)
            file_name = expense.attachment.split("/")[-1]
            delete_user_file(f"{user.id}/{file_name}")
            if not expense:
                return ServiceResult(
                    AppException.GetObject({"expense_id": expense_id})
                )

            expense.attachment = None
            db.add(expense)
            await db.commit()
            return ServiceResult(True)

    @classmethod
    async def update(
        cls, expense_id, user, title, description, amount, attachment
    ) -> ServiceResult:
        db_context = asynccontextmanager(get_db_cm)
        async with db_context() as db:
            q = select(cls).where(cls.id == expense_id, cls.user_id == user.id)
            expense = await db.scalar(q)
            if not expense:
                return ServiceResult(
                    AppException.GetObject({"expense_id": expense_id})
                )

            if not expense.attachment:
                if attachment:
                    url = upload_user_file(attachment, user.id)
                    expense.attachment = url

            expense.title = title
            expense.description = description
            expense.amount = amount
            db.add(expense)

            await db.flush()
            await db.refresh(expense)
            return ServiceResult(expense)
