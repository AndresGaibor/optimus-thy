import { useState } from 'react';
import { subirImagen } from '../../../api/imagenes';
import { TAMANO_MAXIMO_BYTES, esImagenAceptada } from './compartidos';

/** Estado de cada archivo dentro de una subida múltiple. */
export type EstadoArchivo = 'en_cola' | 'subiendo' | 'lista' | 'error' | 'rechazado';

/** Archivo elegido y el resultado de su propia subida. */
export interface ArchivoEnSubida {
  archivo: File;
  estado: EstadoArchivo;
  error: string | null;
}

interface OpcionesSubida {
  /** Caso al que se sube la ecografía. */
  casoId: string;
  /** Se invoca tras una subida correcta con cuántos archivos se guardaron. */
  alSubir: (subidas: number) => void | Promise<void>;
}

/** Estado y acciones del diálogo para subir una o varias ecografías. */
export interface SubidaEcografia {
  abierta: boolean;
  archivos: ArchivoEnSubida[];
  guardando: boolean;
  subir: () => Promise<void>;
  abrir: () => void;
  elegir: (files: File[]) => void;
  cambiarApertura: (abierto: boolean) => void;
}

/** Identidad de un archivo elegido, para no repetirlo en la lista. */
function clave(archivo: File): string {
  return `${archivo.name}:${archivo.size}:${archivo.lastModified}`;
}

/** Motivo por el que un archivo no se puede subir; `null` si es válido. */
function motivoDeRechazo(archivo: File): string | null {
  if (!esImagenAceptada(archivo)) return 'Solo se aceptan imágenes PNG o JPEG.';
  if (archivo.size === 0) return 'El archivo está vacío.';
  if (archivo.size > TAMANO_MAXIMO_BYTES) {
    return 'La imagen supera los 15 MB. Reduce su tamaño antes de subirla.';
  }
  return null;
}

/** Estado y acciones del diálogo para subir una o varias ecografías. */
export function useSubidaEcografia({ casoId, alSubir }: OpcionesSubida): SubidaEcografia {
  const [abierta, setAbierta] = useState(false);
  const [archivos, setArchivos] = useState<ArchivoEnSubida[]>([]);
  const [guardando, setGuardando] = useState(false);

  function marcar(objetivo: File, estado: EstadoArchivo, mensaje: string | null) {
    const buscada = clave(objetivo);
    setArchivos((actuales) =>
      actuales.map((item) =>
        clave(item.archivo) === buscada ? { ...item, estado, error: mensaje } : item,
      ),
    );
  }

  async function subir() {
    if (casoId === '') return;
    const pendientes = archivos.filter(
      (item) => item.estado === 'en_cola' || item.estado === 'error',
    );
    if (pendientes.length === 0) return;
    const huboRechazos = archivos.some((item) => item.estado === 'rechazado');
    setGuardando(true);
    let subidas = 0;
    let fallos = 0;
    for (const item of pendientes) {
      marcar(item.archivo, 'subiendo', null);
      try {
        await subirImagen(casoId, item.archivo);
        marcar(item.archivo, 'lista', null);
        subidas += 1;
      } catch (error) {
        marcar(
          item.archivo,
          'error',
          error instanceof Error
            ? error.message
            : 'No se pudo subir este archivo. Revisa que sea PNG o JPEG de hasta 15 MB y reintenta.',
        );
        fallos += 1;
      }
    }
    setGuardando(false);
    if (subidas > 0) {
      await alSubir(subidas);
    }
    if (fallos === 0 && !huboRechazos) {
      setAbierta(false);
      setArchivos([]);
    }
  }

  function abrir() {
    setArchivos([]);
    setAbierta(true);
  }

  function elegir(files: File[]) {
    setArchivos((actuales) => {
      const existentes = new Set(actuales.map((item) => clave(item.archivo)));
      const nuevos: ArchivoEnSubida[] = [];
      for (const archivo of files) {
        const identificador = clave(archivo);
        if (existentes.has(identificador)) continue;
        existentes.add(identificador);
        const motivo = motivoDeRechazo(archivo);
        const estado: EstadoArchivo = motivo === null ? 'en_cola' : 'rechazado';
        nuevos.push({ archivo, estado, error: motivo });
      }
      return [...actuales, ...nuevos];
    });
  }

  function cambiarApertura(abierto: boolean) {
    setAbierta(abierto);
    if (!abierto) {
      setArchivos([]);
    }
  }

  return { abierta, archivos, guardando, subir, abrir, elegir, cambiarApertura };
}
