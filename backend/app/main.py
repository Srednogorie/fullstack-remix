from contextlib import asynccontextmanager
import os
import debugpy

from fastapi import Depends, FastAPI, Request, WebSocket, WebSocketDisconnect

from fastapi.exceptions import HTTPException as StarletteHTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.openapi.utils import get_openapi
from sqlalchemy import text
import uvicorn

from app.utils.ws_manager import WsConnectionManager

from app.config.users import (
    bearer_auth_backend, fastapi_users, google_bearer_auth_backend,
    google_oauth_client, current_superuser
)

from app.routers import expense_router

from app.schemas.user_schema import (
    UserCreate, UserRead, UserReadRegister, UserUpdate
)
from app.utils.app_exceptions import AppExceptionCase, app_exception_handler
from app.utils.request_exceptions import (
    http_exception_handler, request_validation_exception_handler
)
from app.config.database import get_db_cm

if os.getenv("DEV_ENVIRONMENT") == "development":
    app = FastAPI()
elif os.getenv("DEV_ENVIRONMENT") == "production":
    app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)

ws_manager = WsConnectionManager()

# TODO No any request to the API originate in the browser which means that
# the CSRFMiddleware and the CORSMiddleware are no needed.
# CSRFMiddleware - on first request cookie will be set in the browser.
# Then on unsafe requests the server will try to compare the cookie with
# x-crsftoken value from the header which we set explicitly. If they match
# the request is genuine. As the browser request hits the remix server and not
# the API any such CSRF checks should be done on the remix side. Lax and Strict
# cookies can be used, remix sets lax by default but this can be changed. Older
# browsers don't support Lax.
# https://github.com/remix-run/remix/issues/82
# CORSMiddleware - will check allow_origins and if pass will set appropriate
# CORS headers so the browser can proceed with the post request
# Access-Control-Allow-Origin: http://siteA.com
# Access-Control-Allow-Methods: GET, POST, PUT
# Access-Control-Allow-Headers: Content-Type
# This is all specific to the browser and the requests to our API originate
# on the remix server so some other mechanism should be deployed to guarantee
# that the API only allows certain origins. On the fastapi side simple solution
# would be a global all routes dependency verifying a secret coming from the
# remix server. This will eventually protect safe ass unsafe methods and this
# can be desirable where the API only serves the frontend. On top of this
# global approach additional auth dependency can be placed. The same strategy
# can also be used granularly for public APIs.
# https://stackoverflow.com/questions/10636611/how-does-the-access-control-allow-origin-header-work

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
#     expose_headers=["*"],
# )

# app.add_middleware(
#     CSRFMiddleware,
#     cookie_secure=True,
#     cookie_samesite="none",
#     secret="__CHANGE_ME__",
#     # exempt_urls=[re.compile("/*")]
# )


@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request, e):
    return await http_exception_handler(request, e)


@app.exception_handler(RequestValidationError)
async def custom_validation_exception_handler(request, e):
    return await request_validation_exception_handler(request, e)


@app.exception_handler(AppExceptionCase)
async def custom_app_exception_handler(request, e):
    return await app_exception_handler(request, e)


# User routers
# TODO requires verification must be true in production
app.include_router(
    fastapi_users.get_auth_router(
        bearer_auth_backend, requires_verification=False
    ),
    prefix="/auth/bearer",
    tags=["bearer_auth"]
)
app.include_router(
    fastapi_users.get_oauth_router(
        google_oauth_client,
        google_bearer_auth_backend,
        os.getenv("AUTH_VERIFICATION_SECRET"),
        associate_by_email=True
    ),
    prefix="/auth/bearer/google", tags=["bearer_auth"],
)

app.include_router(
    fastapi_users.get_register_router(UserReadRegister, UserCreate),
    prefix="/auth",
    tags=["register"],
)
# https://aryaniyaps.medium.com/better-email-verification-workflows-13500ce042c7
app.include_router(
    fastapi_users.get_verify_router(UserRead), prefix="/auth", tags=["verify"],
)
app.include_router(
    fastapi_users.get_reset_password_router(), prefix="/auth", tags=["reset"],
)
app.include_router(
    fastapi_users.get_users_router(
        UserRead, UserUpdate, requires_verification=True
    ),
    prefix="/users",
    tags=["users"],
)

# CurrentActiveUser = Annotated[User, Depends(current_active_user)]
# @app.get("/authenticated-route")
# async def authenticated_route(user: CurrentActiveUser):
#     return {"message": f"Hello {user.email}!"}

# Other routers
app.include_router(expense_router.router)


# Healthcheck
@app.get("/")
async def root(request: Request):
    return {"message": "Healthcheck"}

if os.getenv("DEV_ENVIRONMENT") == "development":
    @app.get("/url-list")
    def get_all_urls(request: Request, user: str = Depends(current_superuser)):
        url_list = [
            {"path": route.path, "name": route.name}
            for route in request.app.routes
        ]
        return url_list

    @app.get("/docs")
    async def get_documentation(user: str = Depends(current_superuser)):
        return get_swagger_ui_html(openapi_url="/openapi.json", title="docs")

    @app.get("/redoc")
    async def get_redoc_documentation(user: str = Depends(current_superuser)):
        return get_redoc_html(openapi_url="/openapi.json", title="docs")

    @app.get("/openapi.json")
    async def openapi(user: str = Depends(current_superuser)):
        return get_openapi(title="FastAPI", version="0.1.0", routes=app.routes)


# Websocket
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await ws_manager.broadcast(data)

    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)


if __name__ == "__main__":
    if os.getenv("DEV_ENVIRONMENT") == "development":
        debugpy.listen(("0.0.0.0", 5678))
        debugpy.wait_for_client()
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            ssl_keyfile="/run/secrets/key",
            ssl_certfile="/run/secrets/cert",
        )
    elif os.getenv("DEV_ENVIRONMENT") == "production":
        uvicorn.run(app, host="0.0.0.0", port=8000)
