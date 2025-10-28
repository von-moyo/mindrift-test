import time


async def metrics_middleware(request, call_next):
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
