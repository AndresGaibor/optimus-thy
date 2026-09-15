from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(frozen=True, slots=True)
class AuthUser:
    id: UUID
    email: str
    display_name: str
    role: str


@dataclass(frozen=True, slots=True)
class LoginResult:
    user: AuthUser
    session_token: str
    session_expires_at: datetime
