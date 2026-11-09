# Backend

FastAPI + SQLAlchemy + Alembic. Contrato de la API en `../contracts/openapi.json`.

```bash
pip install -e ".[dev]"
ruff format --check . && ruff check . && mypy app && pytest
python scripts/export_openapi.py   # regenera el contrato
alembic upgrade head               # requiere DATABASE_URL
```
