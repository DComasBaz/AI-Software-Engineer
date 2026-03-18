import logging
import sys
from core.config import settings


class _SuppressWinError10054(logging.Filter):
    """Drop the Windows ProactorEventLoop pipe-cleanup noise.

    On Windows, asyncio raises ConnectionResetError [WinError 10054] in the
    _call_connection_lost callback whenever the remote host closes a connection.
    This happens *after* the response has been fully received and is harmless.
    """

    def filter(self, record: logging.LogRecord) -> bool:
        return "WinError 10054" not in record.getMessage()


def configure_logging() -> None:
    """Configure structured logging for the application."""
    log_level = logging.DEBUG if settings.debug else logging.INFO

    fmt = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
    datefmt = "%Y-%m-%dT%H:%M:%S"

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(fmt=fmt, datefmt=datefmt))

    root = logging.getLogger()
    root.setLevel(log_level)
    root.handlers = [handler]

    # Silence noisy libraries
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)

    # Suppress Windows ProactorEventLoop pipe-cleanup noise (WinError 10054)
    logging.getLogger("asyncio").addFilter(_SuppressWinError10054())


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)