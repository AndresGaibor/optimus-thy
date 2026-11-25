import { KeyRound, Mail, ShieldCheck, User } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
  ROLE_LABELS,
} from '../design-system';
import { useSession } from '../session/SessionContext';
import { FormularioPassword } from './perfil/FormularioPassword';

/**
 * Perfil de la cuenta autenticada (HU-006).
 *
 * Muestra los datos de la sesión y permite cambiar la contraseña. Los datos
 * personales se administran desde la gestión de usuarios; aquí solo se leen.
 */
export function PerfilPage() {
  const { usuario, rolActivo } = useSession();

  if (!usuario) {
    return null;
  }

  const rol = rolActivo ? ROLE_LABELS[rolActivo] : 'Sin rol activo';

  return (
    <section className="mx-auto w-full max-w-(--content-max-width) space-y-6 px-4 py-6">
      <PageHeader
        title="Mi perfil"
        description="Consulta los datos de tu cuenta y cambia tu contraseña."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Datos de la cuenta</CardTitle>
            <CardDescription>
              Estas son las señas con las que trabajas. Para modificarlas, contacta con
              administración.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            <p className="flex items-start gap-3">
              <User aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0">
                <span className="block text-muted-foreground">Nombre</span>
                <span className="font-medium text-foreground">{usuario.nombre}</span>
              </span>
            </p>
            <p className="flex items-start gap-3">
              <Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0">
                <span className="block text-muted-foreground">Correo electrónico</span>
                <span className="break-all font-medium text-foreground">{usuario.correo}</span>
              </span>
            </p>
            <p className="flex items-start gap-3">
              <ShieldCheck
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              />
              <span className="min-w-0">
                <span className="block text-muted-foreground">Área de trabajo activa</span>
                <span className="font-medium text-foreground">{rol}</span>
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound aria-hidden="true" className="size-4 text-muted-foreground" />
              Cambiar contraseña
            </CardTitle>
            <CardDescription>
              Necesitamos tu contraseña actual. La nueva debe cumplir la política de seguridad.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormularioPassword />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
