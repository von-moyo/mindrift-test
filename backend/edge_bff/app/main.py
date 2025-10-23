from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .middleware.request_id import request_id_middleware
from .middleware.logging import configure_logging, logging_middleware
from .middleware.error_handler import add_exception_handlers
from .middleware.metrics import metrics_middleware, metrics_router
from .routers.gateway import router as gateway_router
from .websocket.hub import router as ws_router


def create_app() -> FastAPI:
	app = FastAPI(title="Edge/BFF Service", version="0.1.0")

	# Configure logging early
	configure_logging(service_name="edge_bff")

	# CORS for development
	app.add_middleware(
		CORSMiddleware,
		allow_origins=["*"],
		allow_credentials=True,
		allow_methods=["*"],
		allow_headers=["*"],
	)

	# Middlewares
	app.middleware("http")(request_id_middleware)
	app.middleware("http")(logging_middleware)
	app.middleware("http")(metrics_middleware)

	# Exception handlers
	add_exception_handlers(app)

	# Routers
	app.include_router(metrics_router)
	app.include_router(gateway_router)
	app.include_router(ws_router)

	@app.get("/health")
	async def health():
		return {"status": "ok", "service": "edge_bff", "version": app.version}

	return app


app = create_app()

