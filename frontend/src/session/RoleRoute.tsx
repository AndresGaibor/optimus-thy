import { Navigate, Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useSession } from './SessionContext';
import { homePathFor, type Role } from './roles';
import { LoadingScreen } from '../components/LoadingScreen';
import { Card, CardContent } from '../design-system';
import { EmptyState } from '../design-system';

export function RoleRoute({ role, children }: { role: Role; children: ReactNode }) {
  const { estado, rolActivo } = useSession();

  if (estado === 'cargando') {
    return <LoadingScreen mensaje="Cargando sesión…" />;
  }

  if (estado === 'anonimo') {
    return <Navigate to="/login" replace />;
  }

  if (!rolActivo || rolActivo !== role) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md">
          <CardContent>
            <EmptyState
              title="Acceso denegado"
              description="No tienes permiso para acceder a esta sección con tu rol activo."
              action={
                rolActivo ? (
                  <Link
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    to={homePathFor(rolActivo)}
                  >
                    Volver a tu inicio
                  </Link>
                ) : (
                  <Link
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    to="/login"
                  >
                    Ir a iniciar sesión
                  </Link>
                )
              }
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

export function RootRedirect() {
  const { estado, rolActivo } = useSession();
  if (estado === 'cargando') {
    return <LoadingScreen mensaje="Cargando sesión…" />;
  }
  if (estado === 'anonimo' || !rolActivo) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={homePathFor(rolActivo)} replace />;
}
