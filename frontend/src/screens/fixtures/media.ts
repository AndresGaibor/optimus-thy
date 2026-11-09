import type { DemoImage } from './types';

export const IMAGENES_PRUEBA = {
  ecoDoppler: './images/eco-doppler-color.png',
  ecoHipoecoico: './images/eco-nodulo-hipoecoico.png',
  ecoQuistico: './images/eco-nodulo-quistico.png',
  fichaConsulta: './images/ficha-consulta-general.png',
  fichaEcografia: './images/ficha-ecografia.png',
  fichaLaboratorio: './images/ficha-laboratorio.png',
  fichaPaaf: './images/ficha-paaf-biopsia.png',
  histopatologia: './images/histopatologia-he.png',
  paafCitologia: './images/paaf-citologia.png',
  tcCuello: './images/tc-cuello-axial.png',
} as const;

const FOTOS_DE_PRUEBA = [
  {
    src: IMAGENES_PRUEBA.ecoHipoecoico,
    subtipo: 'Nódulo hipoecoico',
    tamano: '2.4 MB',
    hallazgo: 'Ecografía de prueba del mockup anterior; no corresponde a un estudio clínico real.',
  },
  {
    src: IMAGENES_PRUEBA.ecoDoppler,
    subtipo: 'Doppler color',
    tamano: '5.1 MB',
    hallazgo:
      'Doppler color de prueba del mockup anterior; no corresponde a un estudio clínico real.',
  },
  {
    src: IMAGENES_PRUEBA.ecoQuistico,
    subtipo: 'Nódulo quístico',
    tamano: '2.1 MB',
    hallazgo:
      'Nódulo quístico de prueba del mockup anterior; no corresponde a un estudio clínico real.',
  },
] as const;

export function imagenesConFoto(images: DemoImage[]): DemoImage[] {
  return images.map((image, index) => ({
    ...image,
    ...FOTOS_DE_PRUEBA[index],
    formato: 'PNG',
    resolucion: '1920×1080',
  }));
}
