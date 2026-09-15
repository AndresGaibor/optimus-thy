"""Initial Ola 1 schema for authentication, patients and audit.

Revision ID: 20260915_01
Revises:
Create Date: 2026-09-15
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "20260915_01"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(sa.schema.CreateSchema("security"))
    op.execute(sa.schema.CreateSchema("clinical"))
    op.execute(sa.schema.CreateSchema("audit"))

    op.create_table(
        "institutions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name="pk_institutions"),
        schema="security",
    )
    op.create_table(
        "roles",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("code", sa.Text(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name="pk_roles"),
        sa.UniqueConstraint("code", name="uq_roles_code"),
        schema="security",
    )
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("institution_id", sa.Uuid(), nullable=True),
        sa.Column("role_id", sa.Uuid(), nullable=False),
        sa.Column("email", sa.Text(), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("display_name", sa.Text(), nullable=False),
        sa.Column("active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["institution_id"],
            ["security.institutions.id"],
            name="fk_users_institution_id_institutions",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["role_id"],
            ["security.roles.id"],
            name="fk_users_role_id_roles",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_users"),
        sa.UniqueConstraint("email", name="uq_users_email"),
        schema="security",
    )
    op.create_index("ix_users_institution_id", "users", ["institution_id"], schema="security")
    op.create_index("ix_users_role_id", "users", ["role_id"], schema="security")

    op.create_table(
        "sessions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("token_hash", sa.Text(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["security.users.id"],
            name="fk_sessions_user_id_users",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_sessions"),
        sa.UniqueConstraint("token_hash", name="uq_sessions_token_hash"),
        schema="security",
    )
    op.create_index("ix_sessions_user_id", "sessions", ["user_id"], schema="security")

    op.create_table(
        "patients",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("institution_id", sa.Uuid(), nullable=True),
        sa.Column("public_code", sa.Text(), nullable=False),
        sa.Column("status", sa.Text(), server_default=sa.text("'active'"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint("status IN ('active', 'inactive')", name="ck_patients_status"),
        sa.ForeignKeyConstraint(
            ["institution_id"],
            ["security.institutions.id"],
            name="fk_patients_institution_id_institutions",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_patients"),
        sa.UniqueConstraint("public_code", name="uq_patients_public_code"),
        schema="clinical",
    )
    op.create_index(
        "ix_patients_institution_id",
        "patients",
        ["institution_id"],
        schema="clinical",
    )
    op.create_table(
        "patient_identity",
        sa.Column("patient_id", sa.Uuid(), nullable=False),
        sa.Column("first_names_ciphertext", sa.LargeBinary(), nullable=False),
        sa.Column("last_names_ciphertext", sa.LargeBinary(), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["patient_id"],
            ["clinical.patients.id"],
            name="fk_patient_identity_patient_id_patients",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("patient_id", name="pk_patient_identity"),
        schema="clinical",
    )

    op.create_table(
        "events",
        sa.Column("id", sa.BigInteger(), sa.Identity(), nullable=False),
        sa.Column("actor_user_id", sa.Uuid(), nullable=True),
        sa.Column("action", sa.Text(), nullable=False),
        sa.Column("resource_type", sa.Text(), nullable=False),
        sa.Column("resource_id", sa.Text(), nullable=True),
        sa.Column("allowed", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("request_id", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["actor_user_id"],
            ["security.users.id"],
            name="fk_events_actor_user_id_users",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_events"),
        schema="audit",
    )
    op.create_index("ix_events_actor_user_id", "events", ["actor_user_id"], schema="audit")
    op.create_index("ix_events_request_id", "events", ["request_id"], schema="audit")
    op.create_index("ix_events_created_at", "events", ["created_at"], schema="audit")


def downgrade() -> None:
    op.drop_index("ix_events_created_at", table_name="events", schema="audit")
    op.drop_index("ix_events_request_id", table_name="events", schema="audit")
    op.drop_index("ix_events_actor_user_id", table_name="events", schema="audit")
    op.drop_table("events", schema="audit")

    op.drop_table("patient_identity", schema="clinical")
    op.drop_index("ix_patients_institution_id", table_name="patients", schema="clinical")
    op.drop_table("patients", schema="clinical")

    op.drop_index("ix_sessions_user_id", table_name="sessions", schema="security")
    op.drop_table("sessions", schema="security")
    op.drop_index("ix_users_role_id", table_name="users", schema="security")
    op.drop_index("ix_users_institution_id", table_name="users", schema="security")
    op.drop_table("users", schema="security")
    op.drop_table("roles", schema="security")
    op.drop_table("institutions", schema="security")

    op.execute(sa.schema.DropSchema("audit"))
    op.execute(sa.schema.DropSchema("clinical"))
    op.execute(sa.schema.DropSchema("security"))
