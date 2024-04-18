from __future__ import print_function

import os
import uuid
from typing import Annotated, Optional

import sib_api_v3_sdk
from app.models.user_model import User, get_access_token_db, get_user_db
from fastapi import Depends, Request, Response
from fastapi.responses import JSONResponse
from fastapi_users import BaseUserManager, FastAPIUsers, UUIDIDMixin, models
from fastapi_users.authentication import AuthenticationBackend, BearerTransport
from fastapi_users.authentication.strategy import (AccessTokenDatabase,
                                                   DatabaseStrategy, Strategy)
from fastapi_users.db import SQLAlchemyUserDatabase
from fastapi_users.password import PasswordHelper
from httpx_oauth.clients.google import GoogleOAuth2
from sib_api_v3_sdk.rest import ApiException
from starlette import status

# Key is invalid
google_oauth_client = GoogleOAuth2(
    os.getenv("GOOGLE_OAUTH_CLIENT_ID"),
    os.getenv("GOOGLE_OAUTH_CLIENT_SECRET"),
)


class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = os.getenv("AUTH_VERIFICATION_SECRET")
    verification_token_secret = os.getenv("AUTH_VERIFICATION_SECRET")

    async def on_after_register(
                self, user: User, request: Optional[Request] = None
            ):
        print(f"User {user.id} has registered.")

    async def on_after_forgot_password(
        self, user: User, token: str, request: Optional[Request] = None
    ):
        configuration = sib_api_v3_sdk.Configuration()
        configuration.api_key['api-key'] = os.getenv("BREVO_API_KEY")

        api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
            sib_api_v3_sdk.ApiClient(configuration)
        )
        subject = "Reset your password"
        sender = {"name": "Sando", "email": "akrachunov@gmail.com"}
        to = [{"email": user.email}]
        params = {"token": token}
        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            sender=sender, to=to, subject=subject, template_id=2, params=params
        )

        try:
            api_response = api_instance.send_transac_email(send_smtp_email)
            print(api_response)
        except ApiException as e:
            print(f"Exception when calling SMTPApi->send_transac_email: {e}")
        print(
            f"User {user.id} has forgot their password. Reset token: {token}"
        )

    async def on_after_request_verify(
        self, user: User, token: str, request: Optional[Request] = None
    ):
        configuration = sib_api_v3_sdk.Configuration()
        # Key is invalid
        configuration.api_key['api-key'] = os.getenv("BREVO_API_KEY")

        api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
            sib_api_v3_sdk.ApiClient(configuration)
        )
        subject = "Verify your email"
        sender = {"name": "Sando", "email": "akrachunov@gmail.com"}
        to = [{"email": user.email}]
        params = {"token": token}
        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            sender=sender, to=to, subject=subject, template_id=1, params=params
        )

        try:
            api_response = api_instance.send_transac_email(send_smtp_email)
            print(api_response)
        except ApiException as e:
            print(f"Exception when calling SMTPApi->send_transac_email: {e}")
        print(
            f"Verification requested for user {user.id}. "
            f"Verification token: {token}"
        )

    async def on_after_verify(
            self, user: User, request: Optional[Request] = None
    ):
        print(f"User {user.id} has been verified.")


async def get_user_manager(
            user_db: SQLAlchemyUserDatabase = Depends(get_user_db)
        ):
    yield UserManager(user_db)


class AutoRedirectBearerAuthentication(BearerTransport):
    async def get_login_response(self, user, response):
        await super().get_login_response(user, response)
        response.status_code = status.HTTP_302_FOUND
        response.headers["Location"] = "http://localhost:3000"


# cookie_transport = CookieTransport(
#     cookie_max_age=60, cookie_secure=True, cookie_samesite="none"
# )
# google_cookie_transport = AutoRedirectCookieAuthentication(
#     cookie_max_age=3600, cookie_secure=True, cookie_samesite="none"
# )

bearer_transport = BearerTransport(tokenUrl="auth/bearer/login")


def get_database_strategy(
        access_token_db: AccessTokenDatabase = Depends(get_access_token_db)
) -> DatabaseStrategy:
    # TODO: The expiration time must match the value set in Remix
    # think about setting common aws parameter for production
    return DatabaseStrategy(
        access_token_db, lifetime_seconds=60 * 60 * 24 * 30
    )


class CustomAuthenticationBackend(AuthenticationBackend):
    async def login(
        self, strategy: Strategy[models.UP, models.ID], user: models.UP
    ) -> Response:
        token = await strategy.write_token(user)
        return JSONResponse(
            {
                "access_token": token,
                "token_type": "bearer",
                "user_id": user.id.hex,
            }
        )


bearer_auth_backend = CustomAuthenticationBackend(
    name="bearer",
    transport=bearer_transport,
    get_strategy=get_database_strategy,
)
google_bearer_auth_backend = CustomAuthenticationBackend(
    name="google_bearer",
    transport=bearer_transport,
    get_strategy=get_database_strategy,
)

fastapi_users = FastAPIUsers[User, uuid.UUID](
    get_user_manager, [bearer_auth_backend]
)

current_active_user = fastapi_users.current_user(active=True)
current_superuser = fastapi_users.current_user(superuser=True)
CurrentActiveUser = Annotated[User, Depends(current_active_user)]
