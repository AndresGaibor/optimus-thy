from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, LargeBinary, Text, Uuid, func, text
from sqlalchemy.orm import Mapped, mapped_column

from optimus_thy.shared.database.base import Base


class PatientModel(Base):
    __tablename__ = "patients"
    __table_args__ = (
        CheckConstraint("status IN ('active', 'inactive')", name="status"),
        {"schema": "clinical"},
    )

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    institution_id: Mapped[UUID | None] = mapped_column(
        Uuid, ForeignKey("security.institutions.id", ondelete="RESTRICT"), index=True
    )
    public_code: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'active'"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class PatientIdentityModel(Base):
    __tablename__ = "patient_identity"
    __table_args__ = {"schema": "clinical"}

    patient_id: Mapped[UUID] = mapped_column(
        Uuid,
        ForeignKey("clinical.patients.id", ondelete="CASCADE"),
        primary_key=True,
    )
    first_names_ciphertext: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    last_names_ciphertext: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
