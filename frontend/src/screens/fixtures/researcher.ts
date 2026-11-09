export interface DemoAIModel {
  id: string;
  nombre: string;
  version: string;
  tipo: string;
  estado: 'activo' | 'beta' | 'deprecado';
  descripcion?: string;
  accuracy: number;
  sensitivity: number;
  specificity: number;
}
import type {
  DemoAuditCase,
  DemoCohort,
  DemoDataset,
  DemoDatasetRequest,
  DemoErrorCategory,
  DemoModelMetric,
  DemoTrendGroup,
} from './types';

const metrics: DemoModelMetric[] = [
  {
    modelo: 'Modelo demo A',
    accuracy: 91.2,
    precision: 89.4,
    recall: 92.1,
    f1: 90.7,
    auc: 0.94,
    casos: 84,
  },
  {
    modelo: 'Modelo demo B',
    accuracy: 87.6,
    precision: 88.3,
    recall: 85.2,
    f1: 86.7,
    auc: 0.9,
    casos: 62,
  },
  {
    modelo: 'Modelo demo C',
    accuracy: 89.1,
    precision: 86.7,
    recall: 90.2,
    f1: 88.4,
    auc: 0.92,
    casos: 73,
  },
];

const trend: DemoTrendGroup[] = [
  { modelo: 'Modelo demo A', valores: [68, 74, 71, 82] },
  { modelo: 'Modelo demo B', valores: [59, 64, 70, 67] },
  { modelo: 'Modelo demo C', valores: [62, 69, 72, 76] },
];

const errorCategories: DemoErrorCategory[] = [
  {
    tipo: 'Diferencia de ejemplo A',
    cantidad: 4,
    porcentaje: 5.1,
    severidad: 'Alta',
    descripcion: 'Categoría ilustrativa para la tabla.',
  },
  {
    tipo: 'Diferencia de ejemplo B',
    cantidad: 7,
    porcentaje: 8.9,
    severidad: 'Media',
    descripcion: 'Categoría ilustrativa para la tabla.',
  },
  {
    tipo: 'Campo OCR de ejemplo',
    cantidad: 9,
    porcentaje: 11.4,
    severidad: 'Media',
    descripcion: 'Categoría ilustrativa para la tabla.',
  },
  {
    tipo: 'Revisión pendiente',
    cantidad: 3,
    porcentaje: 3.8,
    severidad: 'Baja',
    descripcion: 'Categoría ilustrativa para la tabla.',
  },
];

const auditCases: DemoAuditCase[] = [
  {
    id: 'DEMO-CASO-001',
    pacienteAnonimo: 'CASO-DEMO-001',
    modelo: 'Modelo demo A',
    prediccion: 'Hallazgo de apoyo A',
    confianza: 74.2,
    revision: 'Categoría ilustrativa A',
    coincide: true,
    tipoError: 'VP',
    fecha: '2026-03-18',
    observacion: 'Registro sintético para mostrar una concordancia.',
  },
  {
    id: 'DEMO-CASO-002',
    pacienteAnonimo: 'CASO-DEMO-002',
    modelo: 'Modelo demo B',
    prediccion: 'Hallazgo de apoyo B',
    confianza: 61.8,
    revision: 'Categoría ilustrativa C',
    coincide: false,
    tipoError: 'FP',
    fecha: '2026-03-14',
    observacion: 'Registro sintético para mostrar una diferencia.',
  },
  {
    id: 'DEMO-CASO-003',
    pacienteAnonimo: 'CASO-DEMO-003',
    modelo: 'Modelo demo C',
    prediccion: 'Hallazgo de apoyo C',
    confianza: 82.1,
    revision: 'Categoría ilustrativa B',
    coincide: true,
    tipoError: 'VN',
    fecha: '2026-03-10',
    observacion: 'Registro sintético para mostrar una concordancia.',
  },
  {
    id: 'DEMO-CASO-004',
    pacienteAnonimo: 'CASO-DEMO-004',
    modelo: 'Modelo demo A',
    prediccion: 'Revisión profesional requerida',
    confianza: 49.5,
    revision: 'Categoría ilustrativa A',
    coincide: false,
    tipoError: 'FN',
    fecha: '2026-03-04',
    observacion: 'Ejemplo sintético de discrepancia que requiere revisión humana.',
  },
];

const datasets: DemoDataset[] = [
  {
    id: 'DEMO-DS-001',
    nombre: 'Conjunto sintético A',
    descripcion: 'Registros sintéticos para explorar tablas y filtros.',
    pacientes: 84,
    inferencias: 126,
    tiRads: '1–4',
    bethesda: 'II–V',
    fecha: '2026-03-18',
    formato: 'CSV sintético',
    tamano: '0 MB',
    partes: ['registros-demo.csv', 'metadatos-demo.json'],
  },
  {
    id: 'DEMO-DS-002',
    nombre: 'Conjunto sintético B',
    descripcion: 'Valores inventados para mostrar metadatos y vistas previas.',
    pacientes: 42,
    inferencias: 73,
    tiRads: '2–5',
    bethesda: 'III–VI',
    fecha: '2026-03-12',
    formato: 'JSON sintético',
    tamano: '0 MB',
    partes: ['muestra-demo.json'],
  },
  {
    id: 'DEMO-DS-003',
    nombre: 'Conjunto sintético C',
    descripcion: 'Ejemplo sin archivos descargables ni casos reales.',
    pacientes: 19,
    inferencias: 31,
    tiRads: '1–3',
    bethesda: 'II–IV',
    fecha: '2026-03-05',
    formato: 'CSV sintético',
    tamano: '0 MB',
    partes: ['muestra-demo.csv'],
  },
];

const datasetRequests: DemoDatasetRequest[] = [
  {
    id: 'DEMO-SOL-001',
    datasetId: 'DEMO-DS-001',
    datasetNombre: 'Conjunto sintético A',
    solicitanteId: 'DEMO-USR-002',
    solicitanteNombre: 'Investigador demo 001',
    fecha: '2026-03-18',
    motivo: 'Ejemplo visual de una solicitud de acceso.',
    estado: 'pendiente',
  },
  {
    id: 'DEMO-SOL-002',
    datasetId: 'DEMO-DS-002',
    datasetNombre: 'Conjunto sintético B',
    solicitanteId: 'DEMO-USR-002',
    solicitanteNombre: 'Investigador demo 001',
    fecha: '2026-03-12',
    motivo: 'Solicitud sintética para mostrar estados resueltos.',
    estado: 'aprobado',
    revisadoPor: 'Administrador demo 001',
  },
];

const cohorts: DemoCohort[] = [
  {
    id: 'DEMO-COH-001',
    nombre: 'Cohorte sintética A',
    descripcion: 'Agrupación ilustrativa sin registros reales.',
    pacientes: 36,
    inferencias: 58,
    tiRads: '2–4',
    bethesda: 'II–V',
    fecha: '2026-03-18',
  },
  {
    id: 'DEMO-COH-002',
    nombre: 'Cohorte sintética B',
    descripcion: 'Ejemplo de filtros por categorías.',
    pacientes: 21,
    inferencias: 33,
    tiRads: '1–3',
    bethesda: 'II–IV',
    fecha: '2026-03-12',
  },
  {
    id: 'DEMO-COH-003',
    nombre: 'Cohorte sintética C',
    descripcion: 'Los conteos son datos ficticios para la interfaz.',
    pacientes: 14,
    inferencias: 22,
    tiRads: '3–5',
    bethesda: 'III–VI',
    fecha: '2026-03-05',
  },
];

const modelCatalog: DemoAIModel[] = [
  {
    id: 'DEMO-MOD-001',
    nombre: 'Modelo demo A',
    version: '1.0',
    tipo: 'Clasificación',
    estado: 'activo',
    descripcion: 'Modelo sintético de apoyo.',
    accuracy: 91.2,
    sensitivity: 92.1,
    specificity: 89.4,
  },
  {
    id: 'DEMO-MOD-002',
    nombre: 'Modelo demo B',
    version: '0.9',
    tipo: 'Detección',
    estado: 'beta',
    descripcion: 'Modelo sintético en prueba.',
    accuracy: 87.6,
    sensitivity: 85.2,
    specificity: 88.3,
  },
  {
    id: 'DEMO-MOD-003',
    nombre: 'Modelo demo C',
    version: '0.8',
    tipo: 'Segmentación',
    estado: 'deprecado',
    descripcion: 'Modelo sintético retirado.',
    accuracy: 89.1,
    sensitivity: 90.2,
    specificity: 86.7,
  },
];
export const researcherFixtures = {
  metrics,
  trend,
  confusionMatrix: [
    [17, 2],
    [3, 12],
  ],
  errorCategories,
  auditCases,
  datasets,
  datasetRequests,
  cohorts,
  modelCatalog,
};
