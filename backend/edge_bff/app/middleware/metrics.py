import time
from fastapi import APIRouter, Request


metrics_router = APIRouter()


async def metrics_middleware(request, call_next):
    # Initialize counters lazily on app.state
    if not hasattr(request.app.state, "metrics"):
        request.app.state.metrics = {
            "requests_total": 0,
            "requests_in_flight": 0,
            "request_duration_ms_total": 0,
        }
    m = request.app.state.metrics
    m["requests_total"] += 1
    m["requests_in_flight"] += 1
    start = time.time()
    try:
        response = await call_next(request)
        return response
    finally:
        duration_ms = int((time.time() - start) * 1000)
        m["request_duration_ms_total"] += duration_ms
        m["requests_in_flight"] -= 1


@metrics_router.get("/metrics", include_in_schema=False)
async def metrics(request: Request):
    # Expose as simple text format for ease of testing
    # requests_total <n>\nrequests_in_flight <n>\nrequest_duration_ms_total <n>\n
    def line(k, v):
        return f"{k} {v}\n"

    # In case state not initialized yet
    metrics = {
        "requests_total": 0,
        "requests_in_flight": 0,
        "request_duration_ms_total": 0,
    }
    state_metrics = getattr(request.app.state, "metrics", None)

    if state_metrics:
        metrics.update(state_metrics)

    body = "".join(line(k, v) for k, v in metrics.items())
    return body
