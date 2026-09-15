import asyncio
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from optimus_thy.config.settings import get_settings
from optimus_thy.shared.security.pii_cipher import PiiCipher

INSTITUTION_ID = UUID("00000000-0000-4000-8000-000000000001")
ROLE_IDS = {
    "medico": UUID("00000000-0000-4000-8000-000000000101"),
    "investigador": UUID("00000000-0000-4000-8000-000000000102"),
    "administrador": UUID("00000000-0000-4000-8000-000000000103"),
}
USER_IDS = {
    "medico": UUID("00000000-0000-4000-8000-000000000201"),
    "investigador": UUID("00000000-0000-4000-8000-000000000202"),
    "administrador": UUID("00000000-0000-4000-8000-000000000203"),
}
PATIENT_ID = UUID("00000000-0000-4000-8000-000000000301")


async def seed_development_data() -> None:
    settings = get_settings()
    if settings.database_url is None:
        raise RuntimeError("DATABASE_URL is required to seed development data")
    if settings.pii_encryption_key_b64 is None:
        raise RuntimeError("PII_ENCRYPTION_KEY_B64 is required to seed patient identity")

    cipher = PiiCipher.from_base64_key(settings.pii_encryption_key_b64.get_secret_value())
    engine = create_async_engine(settings.database_url)
    try:
        async with engine.begin() as connection:
            await connection.execute(
                text(
                    """
                    INSERT INTO security.institutions (id, name, active)
                    VALUES (:id, 'ESPOCH - Desarrollo', true)
                    ON CONFLICT (id) DO UPDATE
                    SET name = EXCLUDED.name, active = EXCLUDED.active
                    """
                ),
                {"id": INSTITUTION_ID},
            )

            for code, name in (
                ("medico", "Médico"),
                ("investigador", "Investigador"),
                ("administrador", "Administrador"),
            ):
                await connection.execute(
                    text(
                        """
                        INSERT INTO security.roles (id, code, name, description)
                        VALUES (:id, :code, :name, 'Rol simulado para desarrollo')
                        ON CONFLICT (id) DO UPDATE
                        SET code = EXCLUDED.code, name = EXCLUDED.name,
                            description = EXCLUDED.description
                        """
                    ),
                    {"id": ROLE_IDS[code], "code": code, "name": name},
                )

            for code, display_name in (
                ("medico", "Médico simulado"),
                ("investigador", "Investigador simulado"),
                ("administrador", "Administrador simulado"),
            ):
                await connection.execute(
                    text(
                        """
                        INSERT INTO security.users
                            (id, institution_id, role_id, email, password_hash,
                             display_name, active)
                        VALUES
                            (:id, :institution_id, :role_id, :email,
                             'seed-disabled-no-login', :display_name, false)
                        ON CONFLICT (id) DO UPDATE
                        SET role_id = EXCLUDED.role_id, email = EXCLUDED.email,
                            display_name = EXCLUDED.display_name, active = false
                        """
                    ),
                    {
                        "id": USER_IDS[code],
                        "institution_id": INSTITUTION_ID,
                        "role_id": ROLE_IDS[code],
                        "email": f"{code}@optimus-thy.example.test",
                        "display_name": display_name,
                    },
                )

            await connection.execute(
                text(
                    """
                    INSERT INTO clinical.patients (id, institution_id, public_code, status)
                    VALUES (:id, :institution_id, 'DEMO-0001', 'active')
                    ON CONFLICT (id) DO UPDATE
                    SET institution_id = EXCLUDED.institution_id,
                        public_code = EXCLUDED.public_code,
                        status = EXCLUDED.status
                    """
                ),
                {"id": PATIENT_ID, "institution_id": INSTITUTION_ID},
            )
            await connection.execute(
                text(
                    """
                    INSERT INTO clinical.patient_identity
                        (patient_id, first_names_ciphertext, last_names_ciphertext)
                    VALUES (:patient_id, :first_names, :last_names)
                    ON CONFLICT (patient_id) DO UPDATE
                    SET first_names_ciphertext = EXCLUDED.first_names_ciphertext,
                        last_names_ciphertext = EXCLUDED.last_names_ciphertext,
                        updated_at = now()
                    """
                ),
                {
                    "patient_id": PATIENT_ID,
                    "first_names": cipher.encrypt_text("Paciente"),
                    "last_names": cipher.encrypt_text("Simulado"),
                },
            )
    finally:
        await engine.dispose()


def main() -> None:
    asyncio.run(seed_development_data())


if __name__ == "__main__":
    main()
