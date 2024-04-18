from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # TODO unique
    app_name: str = "bee_rich"
