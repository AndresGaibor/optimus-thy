import { Badge, RoleBadge } from '../../design-system';
import type { RoleKey } from '../../design-system';

const ROLE_LABELS: Record<RoleKey, string> = {
  medico: 'Médico',
  investigador: 'Investigador',
  administrador: 'Administrador',
};

export function MultiRoleSummary({ roles, activeRole }: { roles: RoleKey[]; activeRole: RoleKey }) {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-1">
        {roles.map((role) => (
          <RoleBadge key={role} role={role} />
        ))}
      </div>
      <div className="text-xs text-muted-foreground">
        Rol activo: <Badge tone="info">{ROLE_LABELS[activeRole]}</Badge>
      </div>
    </div>
  );
}
