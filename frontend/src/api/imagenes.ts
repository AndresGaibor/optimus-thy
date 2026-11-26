import { client } from './client';
import type { components } from './schema';

export interface ImagenCaso {
  id: string;
  caso_id: string;
  sha256: string;
  formato: string;
  ancho: number;
  alto: number;
  tamano_bytes: number;
  sin_metadatos_exif_dicom: boolean;
  creado_en: string;
  url: string;
  url_expira_en: number;
}

interface ListaImagenes {
  total: number;
  items: ImagenCaso[];
}

export async function listarImagenes(casoId: string): Promise<ImagenCaso[]> {
  const { data, error } = await client.GET('/casos/{caso_id}/imagenes', {
    params: { path: { caso_id: casoId } },
  });
  if (error || !data) throw new Error('No se pudieron cargar las ecografías.');
  return (data as unknown as ListaImagenes).items;
}

export async function subirImagen(casoId: string, archivo: File): Promise<ImagenCaso> {
  const cuerpo = new FormData();
  cuerpo.append('archivo', archivo);
  const { data, error } = await client.POST('/casos/{caso_id}/imagenes', {
    params: { path: { caso_id: casoId } },
    // openapi-typescript declara el archivo multipart como texto.
    body: cuerpo as unknown as components['schemas']['Body_cargar_imagen_casos__caso_id__imagenes_post'],
  });
  if (error || !data) {
    const mensaje = (error as { error?: { message?: string } } | undefined)?.error?.message;
    throw new Error(mensaje ?? 'No se pudo subir la ecografía.');
  }
  return data as unknown as ImagenCaso;
}
