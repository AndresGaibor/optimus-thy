import {
  Activity,
  ClipboardList,
  Download,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Button } from '../design-system/components/atoms/Button';
import { RoleBadge } from '../design-system/components/molecules/RoleBadge';
import {
  SidebarLayout,
  type SidebarNavItem,
} from '../design-system/components/organisms/SidebarLayout';
import { ROLE_LABELS, type RoleKey } from '../design-system/tones';
import { useSession } from '../session/SessionContext';
import { homePathFor, ROLES, type Role } from '../session/roles';

const NAV_BY_ROLE: Record<Role, SidebarNavItem[]> = {
  medico: [
    { to: '/medico/pacientes', label: 'Pacientes', icon: Users },
    { to: '/medico/inferencia', label: 'Inferencia', icon: Activity },
  ],
  investigador: [
    { to: '/investigador/cohortes', label: 'Cohortes', icon: LayoutDashboard },
    { to: '/investigador/exportaciones', label: 'Exportaciones', icon: Download },
  ],
  administrador: [
    { to: '/administrador/usuarios', label: 'Usuarios', icon: Users },
    { to: '/administrador/roles', label: 'Roles', icon: ShieldCheck },
    { to: '/administrador/auditoria', label: 'Auditoría', icon: ClipboardList },
  ],
};

export function AppShell() {
  const { usuario, roles, rolActivo, logout, cambiarRolActivo } = useSession();
  const navigate = useNavigate();

  if (!rolActivo || !usuario) return null;

  const rolesDisponibles = ROLES.filter((r) => roles.includes(r));

  return (
    <SidebarLayout
      navItems={NAV_BY_ROLE[rolActivo]}
      navLabel="Navegación principal"
      tone={rolActivo as RoleKey}
      roleLabel={ROLE_LABELS[rolActivo as RoleKey]}
      sessionInfo={
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">{usuario.nombre}</span>
          <RoleBadge role={rolActivo as RoleKey} />
          {rolesDisponibles.length > 1 && (
            <div role="group" aria-label="Cambiar de rol" className="mt-2 flex flex-col gap-1">
              {rolesDisponibles.map((r) => (
                <Button
                  key={r}
                  variant={r === rolActivo ? 'secondary' : 'outline'}
                  size="sm"
                  className="w-full"
                  aria-pressed={r === rolActivo}
                  onClick={async () => {
                    if (r === rolActivo) return;
                    await cambiarRolActivo(r);
                    navigate(homePathFor(r));
                  }}
                >
                  {ROLE_LABELS[r as RoleKey]}
                </Button>
              ))}
            </div>
          )}
        </div>
      }
      sessionActions={
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={async () => {
            await logout();
            navigate('/login');
          }}
        >
          Cerrar sesión
        </Button>
      }
    >
      <Outlet />
    </SidebarLayout>
  );
}
