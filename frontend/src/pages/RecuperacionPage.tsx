import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { confirmarRecuperacion, solicitarRecuperacion } from '../api/recuperacion';
import { PasswordRecoveryPage, type EstadoRecuperacion } from './PasswordRecoveryPage';

/**
 * Recuperación de contraseña con el flujo real.
 *
 * `/login/recuperar` pide el enlace; `/restablecer/:token` lo canjea por una
 * contraseña nueva. La API no distingue si el correo existe: la pantalla dice
 * «si la cuenta existe, recibirás un enlace», nunca «correo no encontrado».
 */
export function RecuperacionPage() {
  const { token } = useParams<{ token?: string }>();
  const [estado, setEstado] = useState<EstadoRecuperacion>(
    token ? 'nueva-contrasena' : 'solicitud',
  );
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const solicitar = async (correo: string) => {
    setEnviando(true);
    setError(null);
    try {
      await solicitarRecuperacion(correo);
      setEstado('enviada');
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No se pudo enviar la solicitud.');
      setEstado('error');
    } finally {
      setEnviando(false);
    }
  };

  const restablecer = async (password: string) => {
    if (!token) {
      setEstado('enlace-expirado');
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const resultado = await confirmarRecuperacion(token, password);
      setEstado(resultado === 'ok' ? 'completada' : 'enlace-expirado');
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No se pudo cambiar la contraseña.');
      setEstado('error');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <PasswordRecoveryPage
      estado={estado}
      error={error}
      enviando={enviando}
      onSolicitar={(correo) => void solicitar(correo)}
      onRestablecer={(password) => void restablecer(password)}
    />
  );
}
