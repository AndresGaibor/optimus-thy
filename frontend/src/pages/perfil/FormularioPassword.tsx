import { Lock } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { cambiarPassword } from '../../api/auth';
import { Button, Callout, Field, Input } from '../../design-system';
import {
  MINIMO_PASSWORD,
  tieneErrores,
  validarPassword,
  type ErroresPassword,
} from './compartidos';

interface ValoresPassword {
  actual: string;
  nueva: string;
  repeticion: string;
}

const VALORES_VACIOS: ValoresPassword = { actual: '', nueva: '', repeticion: '' };

/**
 * Cambio de contraseña con contraseña actual y política RS-ACC-01.
 *
 * La validación del navegador da el primer aviso por campo; el servidor repite
 * la comprobación y devuelve códigos que se asignan al campo correspondiente.
 */
export function FormularioPassword() {
  const [valores, setValores] = useState<ValoresPassword>(VALORES_VACIOS);
  const [errores, setErrores] = useState<ErroresPassword>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [enviando, setEnviando] = useState(false);

  function cambiar(campo: keyof ValoresPassword, valor: string) {
    setValores((previos) => ({ ...previos, [campo]: valor }));
    setErrores((previos) => ({ ...previos, [campo]: undefined }));
    setErrorGeneral(null);
    setExito(false);
  }

  async function enviar() {
    const locales = validarPassword(valores.actual, valores.nueva, valores.repeticion);
    setErrores(locales);
    if (tieneErrores(locales)) {
      return;
    }

    setEnviando(true);
    setErrorGeneral(null);
    setExito(false);
    try {
      const resultado = await cambiarPassword(valores.actual, valores.nueva);
      if (resultado.ok) {
        setValores(VALORES_VACIOS);
        setErrores({});
        setExito(true);
        return;
      }
      if (resultado.codigo === 'password_actual_incorrecta') {
        setErrores({ actual: resultado.mensaje });
        return;
      }
      if (resultado.codigo.startsWith('password_')) {
        setErrores({ nueva: resultado.mensaje });
        return;
      }
      setErrorGeneral(resultado.mensaje);
    } catch {
      setErrorGeneral(
        'No se pudo conectar con el servidor. Revisa tu conexión y vuelve a intentarlo.',
      );
    } finally {
      setEnviando(false);
    }
  }

  function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    void enviar();
  }

  return (
    <form onSubmit={alEnviar} className="grid gap-4" noValidate>
      <Field label="Contraseña actual" error={errores.actual} required>
        <Input
          type="password"
          autoComplete="current-password"
          value={valores.actual}
          onChange={(evento) => cambiar('actual', evento.target.value)}
          disabled={enviando}
        />
      </Field>

      <Field
        label="Contraseña nueva"
        hint={`Al menos ${MINIMO_PASSWORD} caracteres y distinta de la actual.`}
        error={errores.nueva}
        required
      >
        <Input
          type="password"
          autoComplete="new-password"
          value={valores.nueva}
          onChange={(evento) => cambiar('nueva', evento.target.value)}
          disabled={enviando}
        />
      </Field>

      <Field label="Repetir contraseña nueva" error={errores.repeticion} required>
        <Input
          type="password"
          autoComplete="new-password"
          value={valores.repeticion}
          onChange={(evento) => cambiar('repeticion', evento.target.value)}
          disabled={enviando}
        />
      </Field>

      <p className="text-sm text-muted-foreground">
        Al guardar, cerraremos las demás sesiones abiertas de tu cuenta. Esta sesión seguirá activa.
      </p>

      <div className="flex justify-end">
        <Button type="submit" disabled={enviando}>
          <Lock aria-hidden="true" />
          {enviando ? 'Guardando…' : 'Guardar contraseña'}
        </Button>
      </div>

      {errorGeneral ? (
        <Callout tone="danger" role="alert" title="No se pudo cambiar la contraseña">
          {errorGeneral}
          <div className="mt-3">
            <Button type="button" variant="secondary" size="sm" onClick={() => void enviar()}>
              Reintentar
            </Button>
          </div>
        </Callout>
      ) : null}

      {exito ? (
        <Callout tone="success" role="status" title="Contraseña actualizada">
          Las demás sesiones se cerraron. Esta sesión sigue activa.
        </Callout>
      ) : null}
    </form>
  );
}
