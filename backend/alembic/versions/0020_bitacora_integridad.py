"""Encadena criptográficamente la bitácora de auditoría (TES-343)."""

from __future__ import annotations

import hashlib
import json
from collections.abc import Sequence
from datetime import UTC, datetime
from typing import Any

import sqlalchemy as sa

from alembic import op

revision: str = "0020"
down_revision: str | None = "0019"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _hash_evento(
    hash_anterior: str | None,
    ocurrido_en: datetime,
    usuario_id: Any,
    accion: str,
    entidad: str,
    entidad_id: str | None,
    detalles: Any,
) -> str:
    if ocurrido_en.tzinfo is None:
        ocurrido_en = ocurrido_en.replace(tzinfo=UTC)
    instante = ocurrido_en.astimezone(UTC).isoformat(timespec="microseconds").replace("+00:00", "Z")
    contenido = json.dumps(
        [
            hash_anterior,
            instante,
            str(usuario_id) if usuario_id is not None else None,
            accion,
            entidad,
            entidad_id,
            detalles,
        ],
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
        default=str,
    )
    return hashlib.sha256(contenido.encode("utf-8")).hexdigest()


def upgrade() -> None:
    op.add_column("auditoria", sa.Column("hash_anterior", sa.String(length=64), nullable=True))
    op.add_column("auditoria", sa.Column("hash_actual", sa.String(length=64), nullable=True))

    bind = op.get_bind()
    tabla = sa.Table("auditoria", sa.MetaData(), autoload_with=bind)
    es_postgresql = bind.dialect.name == "postgresql"
    if es_postgresql:
        op.execute("ALTER TABLE auditoria DISABLE TRIGGER auditoria_solo_escritura")
    try:
        hash_anterior: str | None = None
        consulta = sa.select(tabla).order_by(tabla.c.id.asc())
        for fila in bind.execute(consulta).mappings():
            hash_actual = _hash_evento(
                hash_anterior,
                fila["ocurrido_en"],
                fila["usuario_id"],
                fila["accion"],
                fila["entidad"],
                fila["entidad_id"],
                fila["detalles"],
            )
            bind.execute(
                sa.update(tabla)
                .where(tabla.c.id == fila["id"])
                .values(hash_anterior=hash_anterior, hash_actual=hash_actual)
            )
            hash_anterior = hash_actual
    finally:
        if es_postgresql:
            op.execute("ALTER TABLE auditoria ENABLE TRIGGER auditoria_solo_escritura")

    op.create_index("uq_auditoria_hash_actual", "auditoria", ["hash_actual"], unique=True)


def downgrade() -> None:
    op.drop_index("uq_auditoria_hash_actual", table_name="auditoria")
    op.drop_column("auditoria", "hash_actual")
    op.drop_column("auditoria", "hash_anterior")
