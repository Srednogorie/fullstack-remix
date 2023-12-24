import asyncio
import os
import sys

from sqlalchemy import select, create_engine
from sqlalchemy.orm import joinedload, sessionmaker

from app import settings
from app.models import *

sys.path.append("/Users/apple/Development/projects/main_api")

db_user = os.getenv("DB_USER")
db_password = os.getenv("DB_PASSWORD")
db_address = os.getenv("DB_ADDRESS")
db_port = os.getenv("DB_PORT")

# TODO A bit tricky to setup async connection in the shell but it's not clear
# why I would need it anyway
DATABASE_URL = (
    f"postgresql+psycopg2://{db_user}:{db_password}"
    f"@{db_address}:{db_port}/{settings.app_name}"
)

engine = create_engine(DATABASE_URL, future=True, echo=True)
Session = sessionmaker(engine, expire_on_commit=False)
session = Session()

# users = session.execute(select(User)).all()
