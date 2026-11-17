import { useCallback, useEffect, useState } from 'react';
import {
  guardarConfiguracion,
  guardarPlantilla,
  leerConfiguracion,
  leerPlantilla,
  probarEnvio,
  restaurarPlantilla,
  type ConfiguracionCorreo,
  type PlantillaCorreo,
} from '../../api/correo';
import type { MensajeCorreo } from './CorreoServidorForm';

const PRESET_GMAIL = { host: 'smtp.gmail.com', puerto: 587, seguridad: 'starttls' as const };

function textoDe(fallo: unknown, porDefecto: string): string {
  return fallo instanceof Error ? fallo.message : porDefecto;
}

/** Estado y acciones de la administración del correo. */
export function useCorreo() {
  const [configuracion, setConfiguracion] = useState<ConfiguracionCorreo | null>(null);
  const [plantilla, setPlantilla] = useState<PlantillaCorreo | null>(null);
  const [preset, setPreset] = useState<'gmail' | 'otro'>('gmail');
  const [password, setPassword] = useState('');
  const [asunto, setAsunto] = useState('');
  const [html, setHtml] = useState('');
  const [mensaje, setMensaje] = useState<MensajeCorreo | null>(null);
  const [mensajePlantilla, setMensajePlantilla] = useState<MensajeCorreo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [probando, setProbando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const [servidor, correo] = await Promise.all([leerConfiguracion(), leerPlantilla()]);
      setConfiguracion(servidor);
      setPlantilla(correo);
      setAsunto(correo.asunto);
      setHtml(correo.html);
      setPreset(servidor.host === PRESET_GMAIL.host ? 'gmail' : 'otro');
    } catch (fallo) {
      setErrorCarga(textoDe(fallo, 'No se pudo cargar la configuración.'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

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
    }
  };

  const guardarLaPlantilla = async () => {
    setGuardando(true);
    setMensajePlantilla(null);
    try {
      const guardada = await guardarPlantilla({ asunto, html });
      setPlantilla(guardada);
      setMensajePlantilla({ tipo: 'ok', texto: 'Plantilla guardada.' });
    } catch (fallo) {
      setMensajePlantilla({
        tipo: 'error',
        texto: textoDe(fallo, 'No se pudo guardar la plantilla.'),
      });
    } finally {
      setGuardando(false);
    }
  };

  const restaurar = async () => {
    setGuardando(true);
    setMensajePlantilla(null);
    try {
      const restaurada = await restaurarPlantilla();
      setPlantilla(restaurada);
      setAsunto(restaurada.asunto);
      setHtml(restaurada.html);
      setMensajePlantilla({ tipo: 'ok', texto: 'Plantilla de fábrica restaurada.' });
    } catch (fallo) {
      setMensajePlantilla({
        tipo: 'error',
        texto: textoDe(fallo, 'No se pudo restaurar la plantilla.'),
      });
    } finally {
      setGuardando(false);
    }
  };

  return {
    configuracion,
    plantilla,
    preset,
    password,
    asunto,
    html,
    mensaje,
    mensajePlantilla,
    setMensajePlantilla,
    cargando,
    errorCarga,
    guardando,
    probando,
    cargar,
    cambiar,
    elegirPreset,
    setPassword,
    setAsunto,
    setHtml,
    guardarServidor,
    enviarPrueba,
    guardarLaPlantilla,
    restaurar,
  };
}
