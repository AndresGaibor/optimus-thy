import type { DemoImage, DemoInference } from './types';

export interface ReporteInferenciaDemo {
  id: string;
  inference: DemoInference;
  images: DemoImage[];
  modeloVersion: string;
  avisoApoyo: string;
  institucion: string;
  unidad: string;
}

export interface ReporteConsolidadoDemo {
  id: string;
  identificadorVerificable: string;
  pacienteId: string;
  pacienteNombre: string;
  inferencias: DemoInference[];
  images: DemoImage[];
  institucion: string;
  unidad: string;
  avisoApoyo: string;
}

export interface DescargaReporteDemo {
  usuario: string;
  hora: string;
  reporteId: string;
}

const avisoApoyo =
  'Resultado de apoyo para revisión profesional. No constituye diagnóstico ni reemplaza el criterio clínico.';

export const reporteInferenciaDemo: ReporteInferenciaDemo = {
  id: 'DEMO-REP-001',
  inference: {
    id: 'DEMO-INF-001',
    pacienteId: 'DEMO-PAC-001',
    pacienteNombre: 'Paciente demo 001',
    modelo: 'Modelo demo A',
    fecha: '2026-03-18 10:20',
    tipoEntrada: 'Ecografía + datos sintéticos',
    resultado: 'Sin nódulo detectado',
    confianza: 76.2,
    incertidumbre: 23.8,
    estado: 'Completado',
    tiRads: '2',
    bethesda: 'No aplica',
  },
  images: [
    {
      id: 'DEMO-IMG-001',
      pacienteId: 'DEMO-PAC-001',
      pacienteNombre: 'Paciente demo 001',
      tipo: 'Ecografía',
      subtipo: 'Ilustración sintética A',
      fecha: '2026-03-18',
      resolucion: 'Ilustración vectorial',
      formato: 'SVG sintético',
      tamano: 'No aplica',
      tiRads: '2',
      hallazgo: 'Representación geométrica de demostración; no es una imagen clínica.',
    },
  ],
  modeloVersion: 'modelo-demo-a v1.4.0',
  avisoApoyo,
  institucion: 'ESPOCH',
  unidad: 'SOLCA',
};

export const reporteConsolidadoDemo: ReporteConsolidadoDemo = {
  id: 'DEMO-CONS-001',
  identificadorVerificable: 'CONS-2026-03-18-PAC001-7F3A',
  pacienteId: 'DEMO-PAC-001',
  pacienteNombre: 'Paciente demo 001',
  inferencias: [
    reporteInferenciaDemo.inference,
    {
      id: 'DEMO-INF-003',
      pacienteId: 'DEMO-PAC-001',
      pacienteNombre: 'Paciente demo 001',
      modelo: 'Modelo demo A',
      fecha: '2026-03-12 15:05',
      tipoEntrada: 'Datos sintéticos',
      resultado: 'Revisión profesional requerida',
      confianza: 52.7,
      incertidumbre: 47.3,
      estado: 'En proceso',
      tiRads: '—',
      bethesda: '—',
    },
    {
      id: 'DEMO-INF-005',
      pacienteId: 'DEMO-PAC-001',
      pacienteNombre: 'Paciente demo 001',
      modelo: 'Modelo demo B',
      fecha: '2026-03-05 09:10',
      tipoEntrada: 'Ecografía',
      resultado: 'Área de interés para revisión',
      confianza: 61.0,
      incertidumbre: 39.0,
      estado: 'Completado',
      tiRads: '3',
      bethesda: 'Pendiente de revisión',
    },
  ],
  images: reporteInferenciaDemo.images,
  institucion: 'ESPOCH',
  unidad: 'SOLCA',
  avisoApoyo,
};

export const descargaReporteDemo: DescargaReporteDemo = {
  usuario: 'Dra. Demo Profesional',
  hora: '2026-03-18 11:05',
  reporteId: 'DEMO-REP-001',
};
