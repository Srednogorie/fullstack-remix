from starlette_csrf import CSRFMiddleware as _CSRFMiddleware
from starlette.types import Receive, Scope, Send
from starlette.requests import Request


class CSRFMiddleware(_CSRFMiddleware):
    async def __call__(
        self, scope: Scope, receive: Receive, send: Send
    ) -> None:
        # type="websocket" will raise an exception at present
        # https://github.com/frankie567/starlette-csrf/issues/14
        if scope["type"] == "http":
            await super().__call__(scope, receive, send)
        else:
            await self.app(scope, receive, send)
