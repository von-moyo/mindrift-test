from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db.session import init_db
from .middleware.request_id import request_id_middleware
from .middleware.logging import configure_logging, logging_middleware
from .middleware.error_handler import add_exception_handlers
from .middleware.metrics import metrics_middleware


def create_app() -> FastAPI:
	app = FastAPI(title="Commerce Service", version="0.1.0")

	# CORS for development
	app.add_middleware(
		CORSMiddleware,
		allow_origins=["*"],
		allow_credentials=True,
		allow_methods=["*"],
		allow_headers=["*"],
	)

	# Logging
	configure_logging(service_name="commerce")

	# Initialize DB (creates file if needed)
	init_db()

	# Health endpoint
	@app.get("/health")
	async def health():
		return {"status": "ok", "service": "commerce", "version": app.version}

	# Middleware and exception handlers
	app.middleware("http")(request_id_middleware)
	app.middleware("http")(logging_middleware)
	app.middleware("http")(metrics_middleware)
	add_exception_handlers(app)

	# Routers (stubs)
	from .api import auth, catalog, cart, orders, stock

	app.include_router(auth.router, prefix="/auth", tags=["auth"])
	app.include_router(catalog.router, prefix="/catalog", tags=["catalog"])
	app.include_router(cart.router, prefix="/cart", tags=["cart"])
	app.include_router(orders.router, prefix="/orders", tags=["orders"])
	app.include_router(stock.router, prefix="/stock", tags=["stock"])

	return app


app = create_app()

