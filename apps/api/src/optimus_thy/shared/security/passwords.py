from pwdlib import PasswordHash

MIN_PASSWORD_LENGTH = 15


class PasswordService:
    def __init__(self) -> None:
        self._password_hash = PasswordHash.recommended()

    def hash_password(self, password: str) -> str:
        if len(password) < MIN_PASSWORD_LENGTH:
            raise ValueError(f"password must be at least {MIN_PASSWORD_LENGTH} characters")
        return self._password_hash.hash(password)

    def verify_and_update(self, password: str, stored_hash: str) -> tuple[bool, str | None]:
        return self._password_hash.verify_and_update(password, stored_hash)
