# Worker boundary

This directory reserves the deployment boundary for OCR/inference workers if real load tests require process or host isolation.

TES-5 does not create a separate worker service. The approved first implementation uses an in-memory executor co-located with the Python runtime while PostgreSQL keeps durable job state.
