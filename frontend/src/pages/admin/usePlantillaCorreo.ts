import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  guardarPlantilla,
  previsualizarPlantilla,
  leerPlantilla,
  restaurarPlantilla,
  type PlantillaCorreo,
} from '../../api/correo';
import type { MensajeCorreo } from './CorreoServidorForm';
import { CAMPOS } from './plantilla-marcadores';

/** Espera antes de pedir la vista previa mientras se escribe, en milisegundos. */
const REBOTE_VISTA = 350;

export type ModoPlantilla = 'visual' | 'html';

function textoDe(fallo: unknown, porDefecto: string): string {
  return fallo instanceof Error ? fallo.message : porDefecto;
}

/** Borrador de la plantilla del correo, con vista previa compuesta por el servidor. */
export function usePlantillaCorreo() {
  const [plantilla, setPlantilla] = useState<PlantillaCorreo | null>(null);
  const [asunto, setAsunto] = useState('');
  const [modo, setModo] = useState<ModoPlantilla>('visual');
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [html, setHtml] = useState('');
  const [vista, setVista] = useState<{ asunto: string; html: string } | null>(null);
  const [vistaCargando, setVistaCargando] = useState(false);
  const [mensaje, setMensaje] = useState<MensajeCorreo | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [iniciado, setIniciado] = useState(false);

  const aplicar = useCallback((fila: PlantillaCorreo) => {
    setPlantilla(fila);
    setAsunto(fila.asunto);
    setModo(fila.modo);
    setCampos({ ...fila.campos });
    setHtml(fila.html);
    setIniciado(true);
  }, []);

  const cargarPlantilla = useCallback(async () => {
    aplicar(await leerPlantilla());
  }, [aplicar]);

  // La vista previa la compone el servidor: es el mismo HTML que se envía.
  useEffect(() => {
    if (!iniciado) return;
    let vigente = true;
    const temporizador = setTimeout(async () => {
      setVistaCargando(true);
      try {
        const entrada = modo === 'visual' ? { asunto, modo, campos } : { asunto, modo, html };
        const nueva = await previsualizarPlantilla(entrada);
        if (vigente) setVista(nueva);
      } catch {
        // Informativa: si falla, se conserva la última vista válida.
      } finally {
        if (vigente) setVistaCargando(false);
      }
    }, REBOTE_VISTA);
    return () => {
      vigente = false;
      clearTimeout(temporizador);
    };
  }, [iniciado, asunto, modo, campos, html]);

  /** Hay cambios sin guardar si el borrador difiere de lo que está en el servidor. */
  const sinGuardar = useMemo(() => {
    if (!plantilla) return false;
    if (plantilla.asunto !== asunto || plantilla.modo !== modo) return true;
    if (modo === 'html') return plantilla.html !== html;
    return CAMPOS.some(
      (campo) => (plantilla.campos?.[campo.clave] ?? '') !== (campos[campo.clave] ?? ''),
    );
  }, [plantilla, asunto, modo, html, campos]);

  const editarCampo = (clave: string, valor: string) => {
    setCampos((actual) => ({ ...actual, [clave]: valor }));
  };

  const guardar = async () => {
    setGuardando(true);
    setMensaje(null);
    try {
      const guardada = await guardarPlantilla(
        modo === 'visual' ? { asunto, modo, campos } : { asunto, modo, html },
      );
      aplicar(guardada);
      setMensaje({ tipo: 'ok', texto: 'Plantilla guardada.' });
    } catch (fallo) {
      setMensaje({ tipo: 'error', texto: textoDe(fallo, 'No se pudo guardar la plantilla.') });
    } finally {
      setGuardando(false);
    }
  };

  const restaurar = async () => {
    setGuardando(true);
    setMensaje(null);
    try {
      aplicar(await restaurarPlantilla());
      setMensaje({ tipo: 'ok', texto: 'Plantilla de fábrica restaurada.' });
    } catch (fallo) {
      setMensaje({ tipo: 'error', texto: textoDe(fallo, 'No se pudo restaurar la plantilla.') });
    } finally {
      setGuardando(false);
    }
  };

  return {
    plantilla,
    sinGuardar,
    asunto,
    modo,
    campos,
    html,
    vista,
    vistaCargando,
    mensaje,
    guardando,
    aplicar,
    cargarPlantilla,
    setAsunto,
    setModo,
    setHtml,
    editarCampo,
    setMensaje,
    guardar,
    restaurar,
  };
}
