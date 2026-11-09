import type { RoleKey } from '../../design-system/tones';

export type OcrEstado = 'En cola' | 'Procesando' | 'Listo' | 'Error';

export interface DocumentoCasoDemo {
  id: string;
  casoId: string;
  pacienteId: string;
  pacienteNombre: string;
  nombre: string;
  tipo: 'PDF' | 'PNG' | 'JPEG';
  tamano: string;
  estadoOcr: OcrEstado | 'Sin procesar';
  motivoError?: string;
  subidoPor: string;
  fecha: string;
}

export interface IntentoOcrDemo {
  id: string;
  documentoId: string;
  fecha: string;
  resultado: 'Éxito' | 'Error' | 'En curso';
  motivo?: string;
}

export interface DescargaDocumentoDemo {
  usuario: string;
  rol: RoleKey;
  hora: string;
  documentoId: string;
  enlaceFirmado: string;
}

export interface CampoOcrCorregidoDemo {
  id: string;
  etiqueta: string;
  leido: string;
  corregido: string;
  confianza: number;
}

export const casoDocumentosDemo = {
  casoId: 'DEMO-CASO-001',
  pacienteId: 'DEMO-PAC-001',
  pacienteNombre: 'Paciente demo 001',
};

export const documentosCasoDemo: DocumentoCasoDemo[] = [
  {
    id: 'DEMO-DOC-001',
    casoId: 'DEMO-CASO-001',
    pacienteId: 'DEMO-PAC-001',
    pacienteNombre: 'Paciente demo 001',
    nombre: 'informe-laboratorio-demo.pdf',
    tipo: 'PDF',
    tamano: '420 KB',
    estadoOcr: 'Listo',
    subidoPor: 'Dra. Demo Profesional',
    fecha: '2026-03-16 09:20',
  },
  {
    id: 'DEMO-DOC-002',
    casoId: 'DEMO-CASO-001',
    pacienteId: 'DEMO-PAC-001',
    pacienteNombre: 'Paciente demo 001',
    nombre: 'ecografia-sintetica.png',
    tipo: 'PNG',
    tamano: '1.2 MB',
    estadoOcr: 'Error',
    motivoError: 'No se pudo leer el texto: contraste insuficiente en la página 1.',
    subidoPor: 'Dra. Demo Profesional',
    fecha: '2026-03-17 08:05',
  },
  {
    id: 'DEMO-DOC-003',
    casoId: 'DEMO-CASO-001',
    pacienteId: 'DEMO-PAC-001',
    pacienteNombre: 'Paciente demo 001',
    nombre: 'referencia-consulta.jpg',
    tipo: 'JPEG',
    tamano: '860 KB',
    estadoOcr: 'En cola',
    subidoPor: 'Dr. Demo Respaldo',
    fecha: '2026-03-18 10:10',
  },
];

export const intentosOcrDemo: IntentoOcrDemo[] = [
  {
    id: 'DEMO-OCR-INT-001',
    documentoId: 'DEMO-DOC-002',
    fecha: '2026-03-17 08:06',
    resultado: 'Error',
    motivo: 'Contraste insuficiente en la página 1.',
  },
  {
    id: 'DEMO-OCR-INT-002',
    documentoId: 'DEMO-DOC-002',
    fecha: '2026-03-17 08:12',
    resultado: 'Error',
    motivo: 'No se detectó texto legible tras el preprocesamiento.',
  },
];

export const documentoBajaCalidadDemo: DocumentoCasoDemo = {
  id: 'DEMO-DOC-004',
  casoId: 'DEMO-CASO-001',
  pacienteId: 'DEMO-PAC-001',
  pacienteNombre: 'Paciente demo 001',
  nombre: 'escaneo-baja-calidad.jpg',
  tipo: 'JPEG',
  tamano: '540 KB',
  estadoOcr: 'Sin procesar',
  subidoPor: 'Dra. Demo Profesional',
  fecha: '2026-03-18 11:00',
};

export const descargaDocumentoDemo: DescargaDocumentoDemo = {
  usuario: 'Dra. Demo Profesional',
  rol: 'medico',
  hora: '2026-03-18 10:35',
  documentoId: 'DEMO-DOC-001',
  enlaceFirmado:
    'https://demo.optimus-thy.local/descargas/firmada?doc=DEMO-DOC-001&exp=2026-03-18T10:40:00Z',
};

export const correccionOcrPersistidaDemo: CampoOcrCorregidoDemo[] = [
  { id: 'tsh', etiqueta: 'TSH', leido: '7,20 mUI/L', corregido: '7,2 mUI/L', confianza: 71 },
  { id: 'tirads', etiqueta: 'TI-RADS', leido: 'TR3', corregido: '3', confianza: 63 },
  {
    id: 'nota',
    etiqueta: 'Nota',
    leido: 'nodulo hipoecoico',
    corregido: 'Nódulo hipoecoico',
    confianza: 84,
  },
];
