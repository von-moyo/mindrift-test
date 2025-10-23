import logging
from typing import Dict, Optional
import httpx


_client: Optional[httpx.AsyncClient] = None


def get_client(timeout: float = 10.0) -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(timeout=httpx.Timeout(timeout), follow_redirects=True)
    return _client


async def proxy_request(
    target_base: str,
    path: str,
    method: str,
    headers: Dict[str, str],
    body: bytes,
) -> httpx.Response:
    client = get_client()
    # Remove hop-by-hop headers and host
    hop_by_hop = {"connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailers", "transfer-encoding", "upgrade"}
    fwd_headers = {k: v for k, v in headers.items() if k.lower() not in hop_by_hop and k.lower() != "host"}
    url = target_base.rstrip("/") + path
    return await client.request(method=method.upper(), url=url, headers=fwd_headers, content=body)
