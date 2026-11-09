import { Lock, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, Callout, Field, Input } from '../design-system';
import { AuthLayout } from '../design-system/components/organisms/AuthLayout';

export type EstadoRecuperacion =
  'solicitud' | 'enviada' | 'error' | 'enlace-expirado' | 'nueva-contrasena' | 'completada';

export interface PasswordRecoveryPageProps {
  /** Estado visual de la pantalla; por defecto, `solicitud`. */
  estado?: EstadoRecuperacion;
}

const descripciones: Record<EstadoRecuperacion, string> = {
  solicitud: 'Te enviaremos un enlace para restablecerla.',
  enviada: 'Revisa tu bandeja de entrada.',
  error: 'No se pudo completar la solicitud.',
  'enlace-expirado': 'El enlace ya no es válido.',
  'nueva-contrasena': 'Elige una contraseña nueva para tu cuenta.',
  completada: 'Tu cuenta está lista.',
};

/**
 * Presenta las etapas visuales de recuperación de contraseña sin ejecutar el flujo.
 *
 * ## Cuándo usarlo
 * Para mostrar los estados del proceso de recuperación de contraseña.
 * ## Cuándo no usarlo
 * No lo uses para enviar correos, validar contraseñas ni administrar enlaces.
 * ## Anatomía
 * Marco de acceso, descripción del estado, contenido y enlace para volver al inicio de sesión.
 * ## Accesibilidad
 * Los campos tienen etiquetas visibles; enlaces y botones conservan su teclado y foco nativos.
 * ## Responsive
 * El panel mantiene el ancho adaptable de `AuthLayout` y los campos ocupan el espacio disponible.
 */
export function PasswordRecoveryPage({ estado = 'solicitud' }: PasswordRecoveryPageProps) {
  return (
    <AuthLayout
      title="Recuperar contraseña"
      description={descripciones[estado]}
      footer={
        <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Volver al inicio de sesión
        </Link>
      }
    >
      <div className="grid gap-4">
        {estado === 'solicitud' && (
          <>
            {/* Presentacional: no envía nada. */}
            <form className="grid gap-4" noValidate onSubmit={(event) => event.preventDefault()}>
              <Field
                label="Correo electrónico"
                required
                hint="Usa el correo con el que te registraron en el sistema."
              >
                <Input
                  type="email"
                  name="correo"
                  autoComplete="email"
                  placeholder="nombre@institucion.edu.ec"
                  startIcon={<Mail className="size-4" />}
                />
              </Field>
              <Button type="submit" className="w-full">
                Enviar enlace
              </Button>
            </form>
          </>
        )}
        {estado === 'enviada' && (
          <>
            <Callout tone="success" title="Solicitud registrada">
              <p>
                Si la dirección está registrada, recibirás un enlace para restablecer la contraseña.
              </p>
              <p>El enlace caduca en 30 minutos y solo sirve una vez.</p>
            </Callout>
            <Button asChild variant="outline" className="w-full">
              <Link to="/login">Volver al acceso</Link>
            </Button>
          </>
        )}
        {estado === 'error' && (
          <>
            <Callout tone="danger" role="alert" title="No pudimos enviar el correo">
              Revisa tu conexión e inténtalo otra vez.
            </Callout>
            <Button className="w-full">Reintentar</Button>
          </>
        )}
        {estado === 'enlace-expirado' && (
          <>
            <Callout tone="warning" title="Enlace caducado o ya usado">
              Los enlaces caducan a los 30 minutos o después de usarse una vez. Solicita uno nuevo.
            </Callout>
            <Button className="w-full">Solicitar otro enlace</Button>
          </>
        )}
        {estado === 'nueva-contrasena' && (
          <>
            {/* Presentacional: no envía nada. */}
            <form className="grid gap-4" noValidate onSubmit={(event) => event.preventDefault()}>
              <Field
                label="Contraseña nueva"
                required
                hint="Al menos 12 caracteres; no reutilices una contraseña de otra cuenta."
              >
                <Input
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  startIcon={<Lock className="size-4" />}
                />
              </Field>
              <Field label="Repetir contraseña" required>
                <Input
                  type="password"
                  name="confirmacion"
                  autoComplete="new-password"
                  startIcon={<Lock className="size-4" />}
                />
              </Field>
              <Button type="submit" className="w-full">
                Guardar contraseña
              </Button>
            </form>
          </>
        )}
        {estado === 'completada' && (
          <>
            <Callout tone="success" title="Contraseña actualizada">
              Ya puedes entrar con tu contraseña nueva.
            </Callout>
            <Button asChild className="w-full">
              <Link to="/login">Ir al acceso</Link>
            </Button>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
