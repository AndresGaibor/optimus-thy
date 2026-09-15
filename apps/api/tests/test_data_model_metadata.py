import optimus_thy.shared.database.models  # noqa: F401
from optimus_thy.shared.database.base import Base


def test_ola1_metadata_contains_only_approved_tables() -> None:
    assert set(Base.metadata.tables) == {
        "security.institutions",
        "security.roles",
        "security.users",
        "security.sessions",
        "clinical.patients",
        "clinical.patient_identity",
        "audit.events",
    }


def test_user_has_single_role_foreign_key() -> None:
    users = Base.metadata.tables["security.users"]

    assert "role_id" in users.c
    assert "usuarios_roles" not in Base.metadata.tables
    assert {fk.target_fullname for fk in users.c.role_id.foreign_keys} == {"security.roles.id"}


def test_patient_identity_stores_ciphertext_not_plaintext_names() -> None:
    identity = Base.metadata.tables["clinical.patient_identity"]

    assert "first_names_ciphertext" in identity.c
    assert "last_names_ciphertext" in identity.c
    assert "first_names" not in identity.c
    assert "last_names" not in identity.c
