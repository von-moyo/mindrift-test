from fastapi.middleware.cors import CORSMiddleware


def add_cors(app, allow_origins=None):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins or ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
