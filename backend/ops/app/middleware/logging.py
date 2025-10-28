import logging
import os
import sys
from logging.handlers import RotatingFileHandler
from time import time


def configure_logging(service_name: str) -> None:
    level_name = os.getenv("LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)
    log_dir = os.getenv("LOG_DIR", "logs")
    os.makedirs(log_dir, exist_ok=True)

    fmt = "%(asctime)s level=%(levelname)s service=%(service)s request_id=%(request_id)s %(message)s"
    datefmt = "%Y-%m-%dT%H:%M:%S%z"

    class ContextFilter(logging.Filter):
        def filter(self, record: logging.LogRecord) -> bool:
            if not hasattr(record, "service"):
                record.service = service_name
            if not hasattr(record, "request_id"):
                record.request_id = getattr(record, "request_id", "-")
            return True

    root = logging.getLogger()
    root.setLevel(level)
    root.handlers = []

    console = logging.StreamHandler(sys.stdout)
    console.setLevel(level)
    console.setFormatter(logging.Formatter(fmt=fmt, datefmt=datefmt))
    console.addFilter(ContextFilter())
    root.addHandler(console)

    file_path = os.path.join(log_dir, f"{service_name}.log")
    rotating = RotatingFileHandler(file_path, maxBytes=5 * 1024 * 1024, backupCount=3)
    rotating.setLevel(level)
    rotating.setFormatter(logging.Formatter(fmt=fmt, datefmt=datefmt))
    rotating.addFilter(ContextFilter())
    root.addHandler(rotating)


async def logging_middleware(request, call_next):
    logger = logging.getLogger(__name__)
    start = time()
    try:
        response = await call_next(request)
        elapsed_ms = int((time() - start) * 1000)
        logger.info(
            "request completed path=%s method=%s status=%s duration_ms=%s",
            request.url.path,
            request.method,
            response.status_code,
            elapsed_ms,
            extra={"request_id": getattr(request.state, "request_id", "-")},
        )
        response.headers["X-Response-Time"] = f"{elapsed_ms}ms"
        return response
    except Exception:
        elapsed_ms = int((time() - start) * 1000)
        logger.exception(
            "request failed path=%s method=%s duration_ms=%s",
            request.url.path,
            request.method,
            elapsed_ms,
            extra={"request_id": getattr(request.state, "request_id", "-")},
        )
        raise
