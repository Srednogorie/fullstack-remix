import contextlib
import random
import string

from app.models.user_model import get_user_db
from app.schemas.user_schema import UserCreate
from app.config.users import get_user_manager
from fastapi_users.exceptions import UserAlreadyExists
import asyncio

from app.config.database import get_db

get_async_session_context = contextlib.asynccontextmanager(get_db)
get_user_manager_context = contextlib.asynccontextmanager(get_user_manager)
get_user_db_context = contextlib.asynccontextmanager(get_user_db)


async def randomword(length):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length))


async def create_user(email: str, password: str, is_superuser: bool = False):
    try:
        async with get_async_session_context() as session:
            async with get_user_db_context(session) as user_db:
                async with get_user_manager_context(user_db) as user_manager:
                    user = await user_manager.create(
                        UserCreate(
                            email=email,
                            username=await randomword(10),
                            password=password,
                            confirm_password=password,
                            is_superuser=is_superuser,
                            is_verified=True,
                        )
                    )
                    print(f"User created {user}")
                    return user
    except UserAlreadyExists:
        print(f"User {email} already exists")
        raise


async def populate_users():
    with open("/code/app/config/fixtures/random_emails_r.txt") as file:
        emails = file.read().splitlines()
        for email in emails:
            await create_user(email, "random_password")


async def main():
    await populate_users()

asyncio.run(main())


########## Block 1 - Generate Random Email Addresses ##########
# import random
# import string

# def generate_random_email():
#     domains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com"]
#     username = ''.join(random.choices(string.ascii_lowercase + string.digits, k=random.randint(5, 10)))
#     domain = random.choice(domains)
#     return f"{username}@{domain}"

# # Generate 100,000 random email addresses
# num_emails = 100000
# emails = [generate_random_email() for _ in range(num_emails)]

# # Save the emails to a file
# file_path = "/Users/apple/Development/projects/fullstack-remix/backend/app/config/fixtures/random_emails.txt"
# with open(file_path, "w") as file:
#     for email in emails:
#         file.write(email + "\n")

# print(f"{num_emails} random email addresses generated and saved to {file_path}")
############# End of Block 1 #############