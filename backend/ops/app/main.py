from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db.session import init_db
from .middleware.request_id import request_id_middleware
from .middleware.logging import configure_logging, logging_middleware
from .middleware.error_handler import add_exception_handlers
from .middleware.metrics import metrics_middleware


def create_app() -> FastAPI:
	app = FastAPI(title="Ops Service", version="0.1.0")

	app.add_middleware(
		CORSMiddleware,
		allow_origins=["*"],
		allow_credentials=True,
		allow_methods=["*"],
		allow_headers=["*"],
	)

	configure_logging(service_name="ops")
	init_db()

	@app.get("/health")
	async def health():
		return {"status": "ok", "service": "ops", "version": app.version}

	# Middleware and exception handlers
	app.middleware("http")(request_id_middleware)
	app.middleware("http")(logging_middleware)
	app.middleware("http")(metrics_middleware)
	add_exception_handlers(app)

	from .api import analytics, notifications

	app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
	app.include_router(notifications.router, prefix="/notifications", tags=["notifications"])

	return app


app = create_app()

