import type { RoleKey } from '../../design-system/tones';

export interface DocumentoCasoDemo {
  id: string;
  casoId: string;
  pacienteId: string;
  pacienteNombre: string;
  nombre: string;
  tipo: 'PDF' | 'PNG' | 'JPEG';
  tamano: string;
  estado: 'Listo' | 'Procesado' | 'Pendiente' | 'En cola' | 'Procesando' | 'Error';
  subidoPor: string;
  fecha: string;
}

export interface DescargaDocumentoDemo {
  usuario: string;
  rol: RoleKey;
  hora: string;
  documentoId: string;
  enlaceFirmado: string;
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
    estado: 'Listo',
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
    estado: 'Error',
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
    estado: 'En cola',
    subidoPor: 'Dr. Demo Respaldo',
    fecha: '2026-03-18 10:10',
  },
];

export const descargaDocumentoDemo: DescargaDocumentoDemo = {
  usuario: 'Dra. Demo Profesional',
  rol: 'medico',
  hora: '2026-03-18 10:35',
  documentoId: 'DEMO-DOC-001',
  enlaceFirmado:
    'https://demo.optimus-thy.local/descargas/firmada?doc=DEMO-DOC-001&exp=2026-03-18T10:40:00Z',
};
