import {
  Activity,
  Building2,
  ClipboardList,
  Download,
  Cpu,
  FileText,
  LayoutDashboard,
  Mail,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Dialog } from '../design-system';
import { Button } from '../design-system/components/atoms/Button';
import { ProfileMenu } from '../design-system/components/molecules/ProfileMenu';
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
    { to: '/medico/resultados', label: 'Resultados', icon: FileText },
    { to: '/medico/inferencia', label: 'Inferencia', icon: Activity },
  ],
  investigador: [
    { to: '/investigador/cohortes', label: 'Cohortes', icon: LayoutDashboard },
    { to: '/investigador/exportaciones', label: 'Exportaciones', icon: Download },
  ],
  administrador: [
    { to: '/administrador/usuarios', label: 'Usuarios', icon: Users },
    { to: '/administrador/instituciones', label: 'Instituciones', icon: Building2 },
    { to: '/administrador/roles', label: 'Roles', icon: ShieldCheck },
    { to: '/administrador/modelos', label: 'Modelos de IA', icon: Cpu },
    { to: '/administrador/correo', label: 'Correo', icon: Mail },
    { to: '/administrador/auditoria', label: 'Auditoría', icon: ClipboardList },
  ],
};

export function AppShell() {
  const { usuario, roles, rolActivo, logout, cambiarRolActivo, sesionPorExpirar, renovarSesion } =
    useSession();
  const navigate = useNavigate();

  if (!rolActivo || !usuario) return null;

  const rolesDisponibles = ROLES.filter((r) => roles.includes(r));

  return (
    <SidebarLayout
      navItems={NAV_BY_ROLE[rolActivo]}
      navLabel="Navegación principal"
      tone={rolActivo as RoleKey}
      sessionInfo={
        <ProfileMenu
          nombre={usuario.nombre ?? usuario.correo ?? 'Cuenta'}
          rolActivo={rolActivo as RoleKey}
          opciones={rolesDisponibles.map((r) => ({
            value: r,
            label: ROLE_LABELS[r as RoleKey],
          }))}
          onCambiarRol={async (valor) => {
            await cambiarRolActivo(valor as Role);
            navigate(homePathFor(valor as Role));
          }}
          onCerrarSesion={async () => {
            await logout();
            navigate('/login');
          }}
        />
      }
    >
      <Dialog
        open={sesionPorExpirar}
        onOpenChange={() => undefined}
        title="Tu sesión está por expirar"
        description="Por inactividad, la sesión se cerrará en menos de un minuto. Continúa si sigues trabajando."
        footer={
          <>
            <Button
              variant="outline"
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
            >
              Cerrar sesión
            </Button>
            <Button onClick={() => void renovarSesion()}>Continuar sesión</Button>
          </>
        }
      />
      <Outlet />
    </SidebarLayout>
  );
}
