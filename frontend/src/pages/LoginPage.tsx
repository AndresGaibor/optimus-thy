import { FormEvent, useState } from 'react';
import { KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Callout, Field, Input } from '../design-system';
import { AuthLayout } from '../design-system/components/organisms/AuthLayout';
import type { LoginChallenge } from '../api/auth';
import { useSession } from '../session/SessionContext';
import { homePathFor } from '../session/roles';

const ERROR_GENERICO = 'No se pudo iniciar sesión. Comprueba tu conexión y vuelve a intentarlo.';

export function LoginPage() {
  const { login, verificarOtp } = useSession();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [desafio, setDesafio] = useState<LoginChallenge | null>(null);
  const [codigo, setCodigo] = useState('');
  const [recuperacion, setRecuperacion] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const res = await login(correo, password);
      if (!res.ok) {
        if (res.challenge) {
          setDesafio(res.challenge);
          setCodigo('');
          return;
        }
        setError(res.mensaje);
        return;
      }
      navigate(homePathFor(res.rol));
    } catch {
      setError(ERROR_GENERICO);
    } finally {
      setEnviando(false);
    }
  };

  const onVerificar = async (e: FormEvent) => {
    e.preventDefault();
    if (!desafio) return;
    setError(null);
    setEnviando(true);
    try {
      const res = await verificarOtp(desafio.desafio, codigo.trim());
      if (!res.ok) {
        setError(
          res.mensaje === 'El código no es válido.' && recuperacion
            ? 'Ese código de recuperación no es válido o ya se utilizó.'
            : res.mensaje,
        );
        if (res.codigo === 'desafio_expirado') {
          setDesafio(null);
          setCodigo('');
          setRecuperacion(false);
        }
        return;
      }
      setDesafio(null);
      setCodigo('');
      setRecuperacion(false);
      navigate(homePathFor(res.rol));
    } catch {
      setError(ERROR_GENERICO);
    } finally {
      setEnviando(false);
    }
  };

  if (desafio) {
    return (
      <AuthLayout
        title="Verifica tu identidad"
        subtitle="Segundo factor"
        description={
          recuperacion
            ? 'Escribe uno de los códigos de recuperación que guardaste al activar el segundo factor.'
            : `Escribe el código de seis dígitos de tu aplicación de autenticación. Caduca en ${Math.max(
                1,
                Math.round(desafio.segundos_para_expirar / 60),
              )} minutos.`
        }
        footer={
          <Link to="/" className="font-medium text-primary underline-offset-4 hover:underline">
            Volver al inicio
          </Link>
        }
      >
        <form className="grid gap-4" onSubmit={onVerificar} noValidate>
          <Field
            label={recuperacion ? 'Código de recuperación' : 'Código de seis dígitos'}
            required
          >
            <Input
              name="codigo"
              autoComplete="one-time-code"
              inputMode={recuperacion ? 'text' : 'numeric'}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              autoFocus
              required
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'login-error' : undefined}
              startIcon={
                recuperacion ? <KeyRound className="size-4" /> : <ShieldCheck className="size-4" />
              }
            />
          </Field>
          {error ? (
            <Callout id="login-error" tone="danger" role="alert">
              {error}
            </Callout>
          ) : null}
          <Button
            type="submit"
            className="w-full"
            loading={enviando}
            disabled={codigo.trim() === ''}
          >
            {enviando ? 'Verificando…' : 'Verificar código'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              setRecuperacion((valor) => !valor);
              setCodigo('');
              setError(null);
            }}
          >
            {recuperacion ? 'Usar un código de la aplicación' : 'Usar un código de recuperación'}
          </Button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Iniciar sesión"
      subtitle="Sistema de Gestión de Datos Clínicos"
      description="Introduce tu correo y contraseña para continuar."
      footer={
        <Link to="/" className="font-medium text-primary underline-offset-4 hover:underline">
          Volver al inicio
        </Link>
      }
    >
      <form className="grid gap-4" onSubmit={onSubmit} noValidate>
        <Field label="Correo electrónico" required>
          <Input
            type="email"
            name="correo"
            autoComplete="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            autoFocus
            required
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'login-error' : undefined}
            startIcon={<Mail className="size-4" />}
          />
        </Field>
        <Field label="Contraseña" required>
          <Input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'login-error' : undefined}
            startIcon={<Lock className="size-4" />}
          />
        </Field>
        <Link
          to="/login/recuperar"
          className="justify-self-end text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </Link>
        {error ? (
          <Callout id="login-error" tone="danger" role="alert">
            {error}
          </Callout>
        ) : null}
        <Button type="submit" className="w-full" loading={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </AuthLayout>
  );
}
