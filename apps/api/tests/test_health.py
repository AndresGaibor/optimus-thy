import asyncio

import httpx2

from optimus_thy.main import create_app


def test_health_returns_ok() -> None:
    async def exercise() -> None:
        transport = httpx2.ASGITransport(app=create_app())
        async with httpx2.AsyncClient(transport=transport, base_url="http://testserver") as client:
            response = await client.get("/health")

        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    asyncio.run(exercise())
