import contextlib
import json
import random
import string

from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.models.user_model import User, get_user_db
from app.schemas.user_schema import UserCreate
from app.config.users import get_user_manager
from fastapi_users.exceptions import UserAlreadyExists
import asyncio

from app.config.database import get_db
from app.models.expense_model import Expense
from app.models.invoice_model import Invoice

get_async_session_context = contextlib.asynccontextmanager(get_db)
get_user_manager_context = contextlib.asynccontextmanager(get_user_manager)
get_user_db_context = contextlib.asynccontextmanager(get_user_db)


async def get_user_entries(email: str):
    async with get_async_session_context() as session:
        q = select(User).where(User.email == email).options(
            joinedload(User.expenses)
        )
        user = await session.scalar(q)
        user_entries_ids = [expense.id for expense in user.expenses]
        return user_entries_ids


async def export_users_entires():
    user_entries = []
    with open("/code/app/config/fixtures/random_emails_r.txt") as in_file:
        emails = in_file.read().splitlines()
        for email in emails:
            user_ids = await get_user_entries(email)
            user_entries.append({email: user_ids})

    with open("/code/app/config/fixtures/users_entires.json", "w") as out_file:
        json.dump(user_entries, out_file)


async def main():
    await export_users_entires()

asyncio.run(main())
