import { useState } from 'react';
import { subirImagen } from '../../../api/imagenes';
import { TAMANO_MAXIMO_BYTES, esImagenAceptada } from './compartidos';

interface OpcionesSubida {
  /** Caso al que se sube la ecografía. */
  casoId: string;
  /** Se invoca tras una subida correcta, antes de refrescar el caso. */
  alSubir: () => void | Promise<void>;
}

/** Estado y acciones del diálogo para subir una ecografía. */
export interface SubidaEcografia {
  abierta: boolean;
  archivo: File | null;
  error: string | null;
  guardando: boolean;
  subir: () => Promise<void>;
  abrir: () => void;
  elegir: (files: File[]) => void;
  cambiarApertura: (abierto: boolean) => void;
}

/** Estado y acciones del diálogo para subir una ecografía. */
export function useSubidaEcografia({ casoId, alSubir }: OpcionesSubida): SubidaEcografia {
  const [abierta, setAbierta] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function subir() {
    if (archivo === null || casoId === '') return;
    setGuardando(true);
    setError(null);
    try {
      await subirImagen(casoId, archivo);
      setAbierta(false);
      setArchivo(null);
      await alSubir();
    } catch {
      setError(
        'No se pudo subir la ecografía. Comprueba que sea PNG o JPEG de hasta 15 MB y que tu rol permita cargarla.',
      );
    } finally {
      setGuardando(false);
    }
  }

  function abrir() {
    setArchivo(null);
    setError(null);
    setAbierta(true);
  }

  function elegir(files: File[]) {
    const seleccionado = files[0];
    if (seleccionado === undefined) return;
    if (!esImagenAceptada(seleccionado)) {
      setArchivo(null);
      setError('Selecciona una imagen PNG o JPEG.');
      return;
    }
    if (seleccionado.size > TAMANO_MAXIMO_BYTES) {
      setArchivo(null);
      setError('La imagen supera los 15 MB. Reduce su tamaño antes de subirla.');
      return;
    }
    setArchivo(seleccionado);
    setError(null);
  }

  function cambiarApertura(abierto: boolean) {
    setAbierta(abierto);
    if (!abierto) {
      setArchivo(null);
      setError(null);
    }
  }

  return { abierta, archivo, error, guardando, subir, abrir, elegir, cambiarApertura };
}
