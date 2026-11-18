import { useCallback, useState } from 'react';
import {
  guardarConfiguracion,
  leerConfiguracion,
  probarEnvio,
  type ConfiguracionCorreo,
} from '../../api/correo';
import type { MensajeCorreo } from './CorreoServidorForm';

const PRESET_GMAIL = { host: 'smtp.gmail.com', puerto: 587, seguridad: 'starttls' as const };

function textoDe(fallo: unknown, porDefecto: string): string {
  return fallo instanceof Error ? fallo.message : porDefecto;
}

/** Servidor SMTP: datos, guardado y envío de la prueba. */
export function useServidorCorreo() {
  const [configuracion, setConfiguracion] = useState<ConfiguracionCorreo | null>(null);
  const [preset, setPreset] = useState<'gmail' | 'otro'>('gmail');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState<MensajeCorreo | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [probando, setProbando] = useState(false);

  const cargarServidor = useCallback(async () => {
    const servidor = await leerConfiguracion();
    setConfiguracion(servidor);
    setPreset(servidor.host === PRESET_GMAIL.host ? 'gmail' : 'otro');
    return servidor;
  }, []);

  /** Refresca la configuración para que el estado muestre la última prueba. */
  const refrescarEstado = useCallback(async () => {
    try {
      setConfiguracion(await leerConfiguracion());
    } catch {
      // El estado es informativo: si no se puede leer, se deja el anterior.
    }
  }, []);

  const cambiar = (parcial: Partial<ConfiguracionCorreo>) => {
    setConfiguracion((actual) => (actual ? { ...actual, ...parcial } : actual));
  };

  const elegirPreset = (valor: 'gmail' | 'otro') => {
    setPreset(valor);
    if (valor === 'gmail') {
      cambiar({
        ...PRESET_GMAIL,
        remitente: configuracion?.remitente || configuracion?.usuario || '',
      });
    }
  };

  const guardarServidor = async () => {
    if (!configuracion) return;
    setGuardando(true);
    setMensaje(null);
    try {
      const guardada = await guardarConfiguracion({
        host: configuracion.host,
        puerto: configuracion.puerto,
        seguridad: configuracion.seguridad,
        usuario: configuracion.usuario,
        remitente: configuracion.remitente,
        remitente_nombre: configuracion.remitente_nombre ?? null,
        activo: configuracion.activo,
        ...(password ? { password } : {}),
      });
      setConfiguracion(guardada);
      setPassword('');
      setMensaje({ tipo: 'ok', texto: 'Configuración guardada.' });
    } catch (fallo) {
      setMensaje({ tipo: 'error', texto: textoDe(fallo, 'No se pudo guardar.') });
    } finally {
      setGuardando(false);
    }
  };

  const enviarPrueba = async () => {
    setProbando(true);
    setMensaje(null);
    try {
      const { destinatario } = await probarEnvio();
      setMensaje({ tipo: 'ok', texto: `Correo de prueba enviado a ${destinatario}.` });
    } catch (fallo) {
      setMensaje({ tipo: 'error', texto: textoDe(fallo, 'No se pudo enviar la prueba.') });
    } finally {
      setProbando(false);
      await refrescarEstado();
    }
  };

  return {
    configuracion,
    preset,
    password,
    mensaje,
    guardando,
    probando,
    cargarServidor,
    refrescarEstado,
    cambiar,
    elegirPreset,
    setPassword,
    setProbando,
    guardarServidor,
    enviarPrueba,
  };
}
