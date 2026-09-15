from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from optimus_thy.modules.audit.infrastructure.persistence.models import AuditEventModel


class AuditService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def record(
        self,
        *,
        action: str,
        resource_type: str,
        actor_user_id: UUID | None = None,
        actor_role: str | None = None,
        active_view: str | None = None,
        resource_id: str | None = None,
        allowed: bool = True,
        request_id: str | None = None,
    ) -> None:
        self._session.add(
            AuditEventModel(
                actor_user_id=actor_user_id,
                actor_role=actor_role,
                active_view=active_view,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                allowed=allowed,
                request_id=request_id,
            )
        )
        await self._session.flush()
