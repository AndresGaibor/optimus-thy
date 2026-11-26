"""Persiste el recuento y el hash final de la bitácora."""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0021"
down_revision: str | None = "0020"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "auditoria_ancla",
        sa.Column("id", sa.SmallInteger(), nullable=False),
        sa.Column("registros", sa.BigInteger(), nullable=False),
        sa.Column("hash_actual", sa.String(length=64), nullable=True),
        sa.CheckConstraint("id = 1", name=op.f("ck_auditoria_ancla_singleton")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_auditoria_ancla")),
    )

    bind = op.get_bind()
    auditoria = sa.table(
        "auditoria",
        sa.column("id", sa.BigInteger()),
        sa.column("hash_actual", sa.String(length=64)),
    )
    registros = bind.execute(sa.select(sa.func.count()).select_from(auditoria)).scalar_one()
    hash_actual = bind.execute(
        sa.select(auditoria.c.hash_actual).order_by(auditoria.c.id.desc()).limit(1)
    ).scalar_one_or_none()
    ancla = sa.table(
        "auditoria_ancla",
        sa.column("id", sa.SmallInteger()),
        sa.column("registros", sa.BigInteger()),
        sa.column("hash_actual", sa.String(length=64)),
    )
    bind.execute(ancla.insert().values(id=1, registros=registros, hash_actual=hash_actual))


def downgrade() -> None:
    op.drop_table("auditoria_ancla")
