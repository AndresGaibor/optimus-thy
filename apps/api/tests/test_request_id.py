import asyncio
from uuid import UUID

import httpx2

from optimus_thy.main import create_app


def test_request_id_is_generated_and_returned() -> None:
    async def exercise() -> None:
        transport = httpx2.ASGITransport(app=create_app())
        async with httpx2.AsyncClient(transport=transport, base_url="http://testserver") as client:
            response = await client.get("/health")

        assert response.status_code == 200
        assert UUID(response.headers["X-Request-ID"])

    asyncio.run(exercise())


def test_safe_inbound_request_id_is_echoed() -> None:
    async def exercise() -> None:
        transport = httpx2.ASGITransport(app=create_app())
        async with httpx2.AsyncClient(transport=transport, base_url="http://testserver") as client:
            response = await client.get("/health", headers={"X-Request-ID": "tes7-request-001"})

        assert response.headers["X-Request-ID"] == "tes7-request-001"

    asyncio.run(exercise())
