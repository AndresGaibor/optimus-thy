import {
  Activity,
  BarChart3,
  ClipboardList,
  FileText,
  Image,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { RoleKey } from '../../design-system/tones';
import { ROLE_LABELS } from '../../design-system/tones';
import { Button } from '../../design-system/components/atoms/Button';
import { RoleBadge } from '../../design-system/components/molecules/RoleBadge';
import {
  SidebarLayout,
  type SidebarNavItem,
} from '../../design-system/components/organisms/SidebarLayout';
import { useConShell } from './shell';
const NAVIGATION: Record<RoleKey, SidebarNavItem[]> = {
  medico: [
    { to: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/doctor/patients', label: 'Pacientes', icon: Users },
    { to: '/doctor/records', label: 'Fichas clínicas', icon: FileText },
    { to: '/doctor/inference', label: 'Inferencia IA', icon: Activity },
    { to: '/doctor/images', label: 'Imágenes', icon: Image },
    { to: '/doctor/results', label: 'Resultados', icon: BarChart3 },
  ],
  investigador: [
    { to: '/researcher/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/researcher/metrics', label: 'Métricas IA', icon: BarChart3 },
    { to: '/researcher/audit', label: 'Auditoría de modelos', icon: ShieldCheck },
    { to: '/researcher/datasets', label: 'Datasets', icon: ClipboardList },
    { to: '/researcher/error-analysis', label: 'Análisis de errores', icon: Activity },
    { to: '/researcher/cohorts', label: 'Cohortes', icon: Users },
  ],
  administrador: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'Usuarios', icon: Users },
    { to: '/admin/roles', label: 'Roles y permisos', icon: ShieldCheck },
    { to: '/admin/audit', label: 'Auditoría', icon: ClipboardList },
    { to: '/admin/settings', label: 'Configuración', icon: Settings },
  ],
};

export interface DemoRoleLayoutProps {
  role: RoleKey;
  onSignOut?: () => void;
  children: ReactNode;
}

export function DemoRoleLayout({ role, onSignOut, children }: DemoRoleLayoutProps) {
  const conShell = useConShell();
  if (!conShell) return <>{children}</>;
  return (
    <SidebarLayout
      navItems={NAVIGATION[role]}
      navLabel={`Navegación de ${role}`}
      sessionInfo={<RoleBadge role={role} />}
      sessionActions={
        onSignOut ? (
          <Button variant="outline" size="sm" className="w-full" onClick={onSignOut}>
            Cerrar sesión
          </Button>
        ) : null
      }
      tone={role}
      roleLabel={ROLE_LABELS[role]}
    >
      {children}
    </SidebarLayout>
  );
}
