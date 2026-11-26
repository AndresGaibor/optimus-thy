import { useEffect, useState, type FormEvent } from 'react';
import {
  confirmarSegundoFactor,
  desactivarSegundoFactor,
  iniciarSegundoFactor,
  me,
} from '../../api/auth';

/**
 * Estado y acciones del segundo factor de la cuenta propia.
 *
 * Vive fuera del componente para que la vista solo componga: aquí quedan la
 * consulta inicial, el enrolamiento, la confirmación del código y la baja con
 * contraseña, con sus mensajes de error legibles.
 */
export function useSegundoFactor() {
  const [activo, setActivo] = useState<boolean | null>(null);
  const [enrolamiento, setEnrolamiento] = useState<{ secreto: string; uri: string } | null>(null);
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [codigos, setCodigos] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    let cancelado = false;
    void me().then((resultado) => {
      if (resultado.ok && !cancelado) setActivo(Boolean(resultado.session.segundo_factor_activo));
    });
    return () => {
      cancelado = true;
    };
  }, []);

  function cerrarDialogo(open: boolean) {
    if (open) return;
    setEnrolamiento(null);
    setCodigos(null);
    setCodigo('');
    setError(null);
  }

  async function iniciar() {
    setError(null);
    setExito(null);
    setOcupado(true);
    try {
      const resultado = await iniciarSegundoFactor();
      if (resultado.ok) setEnrolamiento({ secreto: resultado.secreto, uri: resultado.uri });
      else
        setError(
          resultado.codigo === 'segundo_factor_activo'
            ? 'El segundo factor ya está activado.'
            : 'No se pudo iniciar la activación. Inténtalo de nuevo.',
        );
    } catch {
      setError('No se pudo iniciar la activación. Comprueba tu conexión.');
    } finally {
      setOcupado(false);
    }
  }

  async function confirmar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setOcupado(true);
    try {
      const resultado = await confirmarSegundoFactor(codigo);
      if (!resultado.ok) {
        setError(
          resultado.codigo === 'codigo_invalido'
            ? 'El código no es válido. Comprueba la aplicación y vuelve a intentarlo.'
            : 'No se pudo activar el segundo factor. Inténtalo de nuevo.',
        );
        return;
      }
      setActivo(true);
      setCodigos(resultado.codigos_recuperacion);
      setEnrolamiento(null);
      setCodigo('');
    } catch {
      setError('No se pudo activar el segundo factor. Comprueba tu conexión.');
    } finally {
      setOcupado(false);
    }
  }

  async function desactivar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setExito(null);
    setOcupado(true);
    try {
      const resultado = await desactivarSegundoFactor(password);
      if (!resultado.ok) {
        setError(
          resultado.codigo === 'password_incorrecta'
            ? 'La contraseña no es correcta.'
            : 'No se pudo desactivar el segundo factor. Inténtalo de nuevo.',
        );
        return;
      }
      setActivo(false);
      setPassword('');
      setExito(
        'El segundo factor se desactivó. Los códigos de recuperación anteriores ya no sirven.',
      );
    } catch {
      setError('No se pudo desactivar el segundo factor. Comprueba tu conexión.');
    } finally {
      setOcupado(false);
    }
  }

  return {
    activo,
    enrolamiento,
    codigo,
    setCodigo,
    password,
    setPassword,
    codigos,
    error,
    exito,
    ocupado,
    cerrarDialogo,
    iniciar,
    confirmar,
    desactivar,
  };
}
