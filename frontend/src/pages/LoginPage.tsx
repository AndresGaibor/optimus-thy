import { FormEvent, useState } from 'react';
import { Lock, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Callout, Field, Input } from '../design-system';
import { AuthLayout } from '../design-system/components/organisms/AuthLayout';
import { useSession } from '../session/SessionContext';
import { homePathFor } from '../session/roles';

export function LoginPage() {
  const { login } = useSession();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const res = await login(correo, password);
      if (!res.ok) {
        setError(res.mensaje);
        return;
      }
      navigate(homePathFor(res.rol));
    } finally {
      setEnviando(false);
    }
  };

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
