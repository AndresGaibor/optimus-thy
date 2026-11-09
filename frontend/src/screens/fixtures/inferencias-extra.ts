import type { DemoInference } from './types';

export interface NoduleResult {
  id: string;
  tamano: string;
  composicion: string;
  tiRads: string;
  confianza: number;
}

export const inferenciaVariosNodulos: DemoInference = {
  id: 'DEMO-INF-MULTI-001',
  pacienteId: 'DEMO-PAC-001',
  pacienteNombre: 'Paciente demo 001',
  modelo: 'Modelo tiroideo demo v1.4',
  fecha: '2026-03-20',
  tipoEntrada: 'Ecografía tiroidea sintética',
  resultado: 'Dos nódulos detectados para revisión profesional',
  confianza: 91,
  incertidumbre: 9,
  estado: 'Completado',
  tiRads: '4',
  bethesda: 'No aplica',
};

export const nodulosDeInferencia: NoduleResult[] = [
  { id: 'Nódulo 1', tamano: '18 × 12 mm', composicion: 'Sólido', tiRads: '4', confianza: 91 },
  {
    id: 'Nódulo 2',
    tamano: '9 × 7 mm',
    composicion: 'Mixto quístico-sólido',
    tiRads: '3',
    confianza: 84,
  },
  { id: 'Nódulo 3', tamano: '6 × 5 mm', composicion: 'Espongiforme', tiRads: '2', confianza: 78 },
];

export interface InferenceHistoryRecord extends DemoInference {
  clase: string;
}

export const historialInferencias: InferenceHistoryRecord[] = [
  { ...inferenciaVariosNodulos, id: 'DEMO-HIST-001', clase: 'Nódulo sospechoso' },
  {
    ...inferenciaVariosNodulos,
    id: 'DEMO-HIST-002',
    pacienteId: 'DEMO-PAC-002',
    pacienteNombre: 'Paciente demo 002',
    fecha: '2026-03-19',
    resultado: 'Sin nódulo sospechoso',
    confianza: 96,
    estado: 'Completado',
    tiRads: '2',
    clase: 'Sin nódulo sospechoso',
  },
  {
    ...inferenciaVariosNodulos,
    id: 'DEMO-HIST-003',
    fecha: '2026-03-18',
    resultado: 'Nódulo de baja sospecha',
    confianza: 87,
    tiRads: '3',
    clase: 'Nódulo de baja sospecha',
  },
  {
    ...inferenciaVariosNodulos,
    id: 'DEMO-HIST-004',
    pacienteId: 'DEMO-PAC-003',
    pacienteNombre: 'Paciente demo 003',
    fecha: '2026-03-17',
    resultado: 'Nódulo sospechoso',
    confianza: 89,
    tiRads: '4',
    clase: 'Nódulo sospechoso',
  },
  {
    ...inferenciaVariosNodulos,
    id: 'DEMO-HIST-005',
    fecha: '2026-03-16',
    resultado: 'Sin nódulo sospechoso',
    confianza: 93,
    tiRads: '2',
    clase: 'Sin nódulo sospechoso',
  },
  {
    ...inferenciaVariosNodulos,
    id: 'DEMO-HIST-006',
    pacienteId: 'DEMO-PAC-002',
    pacienteNombre: 'Paciente demo 002',
    fecha: '2026-03-15',
    resultado: 'Nódulo de baja sospecha',
    confianza: 82,
    estado: 'En proceso',
    tiRads: '3',
    clase: 'Nódulo de baja sospecha',
  },
  {
    ...inferenciaVariosNodulos,
    id: 'DEMO-HIST-007',
    fecha: '2026-03-14',
    resultado: 'Nódulo sospechoso',
    confianza: 90,
    tiRads: '4',
    clase: 'Nódulo sospechoso',
  },
  {
    ...inferenciaVariosNodulos,
    id: 'DEMO-HIST-008',
    pacienteId: 'DEMO-PAC-003',
    pacienteNombre: 'Paciente demo 003',
    fecha: '2026-03-13',
    resultado: 'Sin nódulo sospechoso',
    confianza: 95,
    tiRads: '2',
    clase: 'Sin nódulo sospechoso',
  },
];

export const exportacionAnonimizadaDemo = {
  id: 'DEMO-EXP-001',
  fecha: '2026-03-20 11:42',
  dataset: 'Cohorte tiroidea sintética',
  evento: 'Exportación anonimizada confirmada',
  usuario: 'Investigador demo',
};

export const riesgoReidentificacionDemo = {
  k: 5,
  camposGeneralizados: ['Edad en rangos de 10 años', 'Fecha por mes', 'Ubicación por provincia'],
  aviso: 'Los grupos con valores inferiores a K=5 no se publican.',
};
