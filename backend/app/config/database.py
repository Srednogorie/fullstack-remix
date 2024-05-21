import os
from typing import AsyncGenerator

from app import settings
from sqlalchemy import MetaData
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import registry, sessionmaker

db_user = os.getenv("DB_USER")
db_password = os.getenv("DB_PASSWORD")
db_address = os.getenv("DB_ADDRESS")
db_port = os.getenv("DB_PORT")
DATABASE_URL = (
    f"postgresql+asyncpg://{db_user}:{db_password}"
    f"@{db_address}:{db_port}/{settings.app_name}"
)

engine = create_async_engine(DATABASE_URL, echo=True)
async_session = sessionmaker(
    engine, expire_on_commit=False, class_=AsyncSession
)

mapper_registry = registry(
    metadata=MetaData(
        naming_convention={
            "ix": "ix_%(column_0_label)s",
            "uq": "uq_%(table_name)s_%(column_0_name)s",
            "ck": "ck_%(table_name)s_%(constraint_name)s",
            "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",  # noqa
            "pk": "pk_%(table_name)s",
        }
    )
)


async def get_db():
    async with async_session() as session:
        yield session


async def get_db_cm() -> AsyncGenerator:
    async with async_session() as session:
        async with session.begin():
            yield session
