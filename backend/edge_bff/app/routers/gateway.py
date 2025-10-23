from fastapi import APIRouter, Request, Response
from ..core.config import get_settings
from ..core.proxy import proxy_request


router = APIRouter()


def _route(path_tail: str) -> str:
    return "/api/" + path_tail


@router.api_route(_route("{full_path:path}"), methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def gateway(full_path: str, request: Request) -> Response:
    settings = get_settings()

    # Determine target based on path prefixes
    # Map to Commerce
    commerce_prefixes = ("auth/", "catalog/", "cart/", "orders/", "stock/")
    ops_prefixes = ("analytics/", "notifications/")

    original_path = full_path
    if any(original_path.startswith(p) for p in commerce_prefixes):
        base = settings.COMMERCE_BASE_URL
    elif any(original_path.startswith(p) for p in ops_prefixes):
        base = settings.OPS_BASE_URL
    else:
        # Unknown path; return 404 with context
        return Response(status_code=404, content=f"Unknown API path: /api/{original_path}")

    # Preserve the tailing path as-is
    body = await request.body()
    upstream_resp = await proxy_request(
        target_base=base,
        path="/" + original_path,
        method=request.method,
        headers=dict(request.headers),
        body=body,
    )

    # Stream back the response
    headers = [(k, v) for k, v in upstream_resp.headers.items()]
    return Response(content=upstream_resp.content, status_code=upstream_resp.status_code, headers=dict(headers))
