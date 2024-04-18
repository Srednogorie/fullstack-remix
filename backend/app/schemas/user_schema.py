import uuid

from fastapi_users import schemas, models
from pydantic import model_validator, BaseModel


class UserRead(schemas.BaseUser[uuid.UUID]):
    username: str | None


class UserReadRegister(BaseModel):
    id: models.ID
    email: str

    class Config:
        from_attributes = True


class UserCreate(schemas.BaseUserCreate):
    username: str
    confirm_password: str

    class Config:
        json_schema_extra = {
            "example": {
                "email": "sash@gmail.com",
                "username": "sash",
                "password": "",
                "confirm_password": "",
            }
        }

    @model_validator(mode='after')
    def check_passwords_match(self) -> 'UserCreate':
        pw1 = self.password
        pw2 = self.confirm_password
        if pw1 is not None and pw2 is not None and pw1 != pw2:
            raise ValueError('passwords do not match')
        del self.confirm_password
        return self


class UserUpdate(schemas.BaseUserUpdate):
    username: str
