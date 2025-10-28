import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


def add_exception_handlers(app: FastAPI) -> None:
    logger = logging.getLogger(__name__)

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.exception(
            "unhandled exception path=%s",
            request.url.path,
            extra={"request_id": getattr(request.state, "request_id", "-")},
        )
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "type": "InternalServerError",
                    "message": "An unexpected error occurred.",
                    "request_id": getattr(request.state, "request_id", "-"),
                }
            },
        )
