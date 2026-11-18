import { useCallback, useEffect, useState } from 'react';
import {
  guardarConfiguracion,
  leerConfiguracion,
  leerPlantilla,
  probarEnvio,
  type ConfiguracionCorreo,
} from '../../api/correo';
import type { MensajeCorreo } from './CorreoServidorForm';
import { usePlantillaCorreo } from './usePlantillaCorreo';

const PRESET_GMAIL = { host: 'smtp.gmail.com', puerto: 587, seguridad: 'starttls' as const };

function textoDe(fallo: unknown, porDefecto: string): string {
  return fallo instanceof Error ? fallo.message : porDefecto;
}

/** Estado y acciones de la administración del correo: servidor y plantilla. */
export function useCorreo() {
  const plantilla = usePlantillaCorreo();
  const [configuracion, setConfiguracion] = useState<ConfiguracionCorreo | null>(null);
  const [preset, setPreset] = useState<'gmail' | 'otro'>('gmail');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState<MensajeCorreo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [probando, setProbando] = useState(false);

  const { aplicar } = plantilla;

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const [servidor, correo] = await Promise.all([leerConfiguracion(), leerPlantilla()]);
      setConfiguracion(servidor);
      aplicar(correo);
      setPreset(servidor.host === PRESET_GMAIL.host ? 'gmail' : 'otro');
    } catch (fallo) {
      setErrorCarga(textoDe(fallo, 'No se pudo cargar la configuración.'));
    } finally {
      setCargando(false);
    }
  }, [aplicar]);

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

  return {
    configuracion,
    preset,
    password,
    mensaje,
    cargando,
    errorCarga,
    guardando,
    probando,
    cargar,
    cambiar,
    elegirPreset,
    setPassword,
    guardarServidor,
    enviarPrueba,
    plantillaGuardada: plantilla.plantilla,
    asunto: plantilla.asunto,
    modo: plantilla.modo,
    campos: plantilla.campos,
    html: plantilla.html,
    vista: plantilla.vista,
    vistaCargando: plantilla.vistaCargando,
    mensajePlantilla: plantilla.mensaje,
    guardandoPlantilla: plantilla.guardando,
    setMensajePlantilla: plantilla.setMensaje,
    setAsunto: plantilla.setAsunto,
    setModo: plantilla.setModo,
    setHtml: plantilla.setHtml,
    editarCampo: plantilla.editarCampo,
    guardarLaPlantilla: plantilla.guardar,
    restaurar: plantilla.restaurar,
  };
}
