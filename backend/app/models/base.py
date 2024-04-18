from app.config.database import mapper_registry
from sqlalchemy import Column, DateTime
from sqlalchemy.sql import func


@mapper_registry.mapped
class CreatedUpdateBase:
    __abstract__ = True
    created = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated = Column(DateTime(timezone=True), onupdate=func.now())
