from contextlib import asynccontextmanager
from typing import Optional
from sqlalchemy import (
    Column, Integer, String, Text, select, desc,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.config.database import mapper_registry, get_db_cm
from app.models.base import CreatedUpdateBase
from app import schemas
from app.utils.app_exceptions import AppException
from app.utils.service_result import ServiceResult


@mapper_registry.mapped
class Note(CreatedUpdateBase):
    __tablename__ = "notes"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(64))
    content: Mapped[Optional[str]] = mapped_column(Text)

    def __repr__(self):
        return f'Note({self.id}, "{self.title}")'

    @classmethod
    async def create(cls, item: schemas.Note) -> ServiceResult:
        db_context = asynccontextmanager(get_db_cm)
        async with db_context() as db:
            note = cls(**item.model_dump())
            db.add(note)
            await db.commit()

            if not note:
                return ServiceResult(AppException.CreateObject())
            return ServiceResult(True)

    @classmethod
    async def get(cls, note_id: int) -> ServiceResult:
        db_context = asynccontextmanager(get_db_cm)
        async with db_context() as db:
            note = await db.get(cls, note_id)
            if not note:
                return ServiceResult(
                    AppException.GetObject({"note_id": note_id})
                )
            # if not product.public:
            #      return ServiceResult(AppException.ObjectRequiresAuth())
            return ServiceResult(note)

    @classmethod
    async def get_all(cls) -> ServiceResult:
        db_context = asynccontextmanager(get_db_cm)
        async with db_context() as db:
            q = select(cls).order_by(desc(cls.id))
            return ServiceResult([x async for x in await db.stream_scalars(q)])

    @classmethod
    async def delete(cls, note_id) -> ServiceResult:
        db_context = asynccontextmanager(get_db_cm)
        async with db_context() as db:
            note = await db.get(cls, note_id)
            if not note:
                return ServiceResult(
                    AppException.GetObject({"note_id": note_id})
                )
            await db.delete(note)
            await db.commit()
            return ServiceResult(True)

    @classmethod
    async def update(cls, note_id, data) -> ServiceResult:
        db_context = asynccontextmanager(get_db_cm)
        async with db_context() as db:
            note = await db.get(cls, note_id)
            if not note:
                return ServiceResult(
                    AppException.GetObject({"note_id": note_id})
                )
            for key, value in data.items():
                setattr(note, key, value)
            db.add(note)
            await db.commit()
            await db.refresh(note)
            return ServiceResult(note)
