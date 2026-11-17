import { Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Callout, Field, Input } from '../design-system';
import { AuthLayout } from '../design-system/components/organisms/AuthLayout';

export type EstadoRecuperacion =
  'solicitud' | 'enviada' | 'error' | 'enlace-expirado' | 'nueva-contrasena' | 'completada';

export interface PasswordRecoveryPageProps {
  /** Estado visual de la pantalla; por defecto, `solicitud`. */
  estado?: EstadoRecuperacion;
  /** Mensaje de error ya apto para el usuario. */
  error?: string | null;
  /** Deshabilita los formularios mientras la petición está en curso. */
  enviando?: boolean;
  /** Envía la solicitud; sin este callback la pantalla es solo visual. */
  onSolicitar?: (correo: string) => void;
  /** Confirma la contraseña nueva; sin este callback la pantalla es solo visual. */
  onRestablecer?: (password: string) => void;
}

const descripciones: Record<EstadoRecuperacion, string> = {
  solicitud: 'Te enviaremos un enlace para restablecerla.',
  enviada: 'Revisa tu bandeja de entrada.',
  error: 'No se pudo completar la solicitud.',
  'enlace-expirado': 'El enlace ya no es válido.',
  'nueva-contrasena': 'Elige una contraseña nueva para tu cuenta.',
  completada: 'Tu cuenta está lista.',
};

const MINIMO_PASSWORD = 12;

/**
 * Presenta y completa el proceso de recuperación de contraseña.
 *
 * ## Cuándo usarlo
 * Para pedir el enlace de recuperación y para elegir la contraseña nueva desde el enlace.
 * ## Cuándo no usarlo
 * No lo uses para iniciar sesión ni para administrar usuarios.
 * ## Anatomía
 * Marco de acceso, descripción del estado, formulario del paso correspondiente y enlace de vuelta.
 * ## Accesibilidad
 * Los campos tienen etiquetas visibles y errores asociados; los formularios se envían con Enter y el foco vuelve al primer campo inválido.
 * ## Responsive
 * El panel mantiene el ancho adaptable de `AuthLayout` y los campos ocupan el espacio disponible.
 */
export function PasswordRecoveryPage({
  estado = 'solicitud',
  error = null,
  enviando = false,
  onSolicitar,
  onRestablecer,
}: PasswordRecoveryPageProps) {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [repeticion, setRepeticion] = useState('');
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const mensaje = error ?? errorLocal;

  const solicitar = (evento: React.FormEvent) => {
    evento.preventDefault();
    setErrorLocal(null);
    if (!correo.trim()) {
      setErrorLocal('Escribe tu correo electrónico.');
      return;
    }
    onSolicitar?.(correo.trim());
  };

  const restablecer = (evento: React.FormEvent) => {
    evento.preventDefault();
    setErrorLocal(null);
    if (password.length < MINIMO_PASSWORD) {
      setErrorLocal(`Usa al menos ${MINIMO_PASSWORD} caracteres.`);
      return;
    }
    if (password !== repeticion) {
      setErrorLocal('Las contraseñas no coinciden.');
      return;
    }
    onRestablecer?.(password);
  };

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
      {estado === 'solicitud' ? (
        <form onSubmit={solicitar} className="grid gap-4" noValidate>
          <Field label="Correo electrónico">
            <Input
              type="email"
              autoComplete="email"
              value={correo}
              onChange={(evento) => setCorreo(evento.target.value)}
              required
            />
          </Field>
          {mensaje ? <Callout tone="danger">{mensaje}</Callout> : null}
          <Button type="submit" disabled={enviando}>
            <Mail aria-hidden="true" className="size-4" />
            {enviando ? 'Enviando…' : 'Enviar enlace'}
          </Button>
        </form>
      ) : null}

      {estado === 'enviada' ? (
        <Callout tone="info" title="Solicitud recibida">
          Si el correo pertenece a una cuenta activa, recibirás un enlace con vigencia limitada.
          Revisa también la carpeta de correo no deseado.
        </Callout>
      ) : null}

      {estado === 'error' ? (
        <Callout tone="danger" title="No se pudo completar">
          {mensaje ?? 'Reintenta en un momento o solicita un enlace nuevo.'}
        </Callout>
      ) : null}

      {estado === 'enlace-expirado' ? (
        <>
          <Callout tone="warning" title="Enlace no válido">
            El enlace ya se usó o caducó. Solicita uno nuevo.
          </Callout>
          <p className="text-sm">
            <Link
              to="/login/recuperar"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Solicitar otro enlace
            </Link>
          </p>
        </>
      ) : null}

      {estado === 'nueva-contrasena' ? (
        <form onSubmit={restablecer} className="grid gap-4" noValidate>
          <Field label="Contraseña nueva" hint={`Al menos ${MINIMO_PASSWORD} caracteres.`}>
            <Input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(evento) => setPassword(evento.target.value)}
              required
            />
          </Field>
          <Field label="Repetir contraseña">
            <Input
              type="password"
              autoComplete="new-password"
              value={repeticion}
              onChange={(evento) => setRepeticion(evento.target.value)}
              required
            />
          </Field>
          {mensaje ? <Callout tone="danger">{mensaje}</Callout> : null}
          <Button type="submit" disabled={enviando}>
            <Lock aria-hidden="true" className="size-4" />
            {enviando ? 'Guardando…' : 'Guardar contraseña'}
          </Button>
        </form>
      ) : null}

      {estado === 'completada' ? (
        <>
          <Callout tone="success" title="Contraseña actualizada">
            Ya puedes entrar con tu contraseña nueva. Cerramos las sesiones que estaban abiertas.
          </Callout>
          <p className="text-sm">
            <Link
              to="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Ir al inicio de sesión
            </Link>
          </p>
        </>
      ) : null}
    </AuthLayout>
  );
}
