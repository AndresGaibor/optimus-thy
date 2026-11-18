import { useCallback, useEffect, useState } from 'react';
import { probarEnvio } from '../../api/correo';
import { usePlantillaCorreo } from './usePlantillaCorreo';
import { useServidorCorreo } from './useServidorCorreo';

function textoDe(fallo: unknown, porDefecto: string): string {
  return fallo instanceof Error ? fallo.message : porDefecto;
}

/** Estado y acciones de la administración del correo: servidor y plantilla. */
export function useCorreo() {
  const servidor = useServidorCorreo();
  const plantilla = usePlantillaCorreo();
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      await Promise.all([servidor.cargarServidor(), plantilla.cargarPlantilla()]);
    } catch (fallo) {
      setErrorCarga(textoDe(fallo, 'No se pudo cargar la configuración.'));
    } finally {
      setCargando(false);
    }
  }, [servidor.cargarServidor, plantilla.cargarPlantilla]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  /** La misma prueba, pero con el aviso en la pestaña de la plantilla. */
  const enviarPruebaPlantilla = async () => {
    servidor.setProbando(true);
    plantilla.setMensaje(null);
    try {
      const { destinatario } = await probarEnvio();
      plantilla.setMensaje({
        tipo: 'ok',
        texto: `Correo de prueba con la plantilla actual enviado a ${destinatario}.`,
      });
    } catch (fallo) {
      plantilla.setMensaje({
        tipo: 'error',
        texto: textoDe(fallo, 'No se pudo enviar la prueba.'),
      });
    } finally {
      servidor.setProbando(false);
      await servidor.refrescarEstado();
    }
  };

  return {
    configuracion: servidor.configuracion,
    preset: servidor.preset,
    password: servidor.password,
    mensaje: servidor.mensaje,
    cargando,
    errorCarga,
    guardando: servidor.guardando,
    probando: servidor.probando,
    cargar,
    cambiar: servidor.cambiar,
    elegirPreset: servidor.elegirPreset,
    setPassword: servidor.setPassword,
    guardarServidor: servidor.guardarServidor,
    enviarPrueba: servidor.enviarPrueba,
    enviarPruebaPlantilla,
    plantillaGuardada: plantilla.plantilla,
    asunto: plantilla.asunto,
    modo: plantilla.modo,
    campos: plantilla.campos,
    html: plantilla.html,
    vista: plantilla.vista,
    vistaCargando: plantilla.vistaCargando,
    sinGuardar: plantilla.sinGuardar,
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
