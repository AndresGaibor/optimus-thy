# API contracts

FastAPI/OpenAPI is the canonical HTTP contract for OPTIMUS-THY.

`openapi.json` is generated from the running FastAPI application with:

```bash
make contracts
```

Do not edit `openapi.json` by hand. Change FastAPI routes/schemas/security metadata first, regenerate the contract, and commit the generated diff.

Frontend TypeScript clients/types may be generated from this artifact later. Do not maintain a second hand-written copy of backend DTOs in this package.
