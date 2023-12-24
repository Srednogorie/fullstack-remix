from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession


class DBSessionContext(object):
    def __init__(self, db: AsyncSession | Any):
        self.db = db


class AppService(DBSessionContext):
    pass


class AppCRUD(DBSessionContext):
    pass
