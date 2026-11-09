import type {
  ActivityType,
  DatasetRequestStatus,
  InferenceStatus,
  RecordStatus,
  RoleKey,
  UserActivityStatus,
} from '../../design-system/tones';

export interface DemoPatient {
  id: string;
  historia: string;
  nombre: string;
  edad: number;
  sexo: 'F' | 'M';
  institucion: string;
  ultimaConsulta: string;
}

export interface DemoLab {
  id: string;
  pacienteId: string;
  fecha: string;
  tsh: string;
  t3: string;
  t4: string;
  laboratorio: string;
}

export interface DemoRecord {
  id: string;
  pacienteId: string;
  pacienteNombre: string;
  fecha: string;
  tipo: string;
  estado: RecordStatus;
  paginas: number;
  ocrConfianza: number;
  /** URL de imagen de prueba solo para el catálogo; la app no la define. */
  src?: string;
}

export interface DemoInference {
  id: string;
  pacienteId: string;
  pacienteNombre: string;
  modelo: string;
  fecha: string;
  tipoEntrada: string;
  resultado: string;
  confianza: number;
  incertidumbre: number;
  estado: InferenceStatus;
  tiRads: string;
  bethesda: string;
}

export interface DemoImage {
  id: string;
  pacienteId: string;
  pacienteNombre: string;
  tipo: string;
  subtipo: string;
  fecha: string;
  resolucion: string;
  formato: string;
  tamano: string;
  tiRads: string;
  hallazgo: string;
  /** URL de imagen de prueba solo para el catálogo; la app no la define. */
  src?: string;
}

export interface DemoTimelineEvent {
  id: string;
  pacienteId: string;
  fecha: string;
  tipo: string;
  titulo: string;
  detalle: string;
}

export interface DemoModelMetric {
  modelo: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  auc: number;
  casos: number;
}

export interface DemoErrorCategory {
  tipo: string;
  cantidad: number;
  porcentaje: number;
  severidad: 'Alta' | 'Media' | 'Baja';
  descripcion: string;
}

export interface DemoAuditCase {
  id: string;
  pacienteAnonimo: string;
  modelo: string;
  prediccion: string;
  confianza: number;
  revision: string;
  coincide: boolean;
  tipoError: 'VP' | 'VN' | 'FP' | 'FN';
  fecha: string;
  observacion: string;
}

export interface DemoDataset {
  id: string;
  nombre: string;
  descripcion: string;
  pacientes: number;
  inferencias: number;
  tiRads: string;
  bethesda: string;
  fecha: string;
  formato: string;
  tamano: string;
  partes: string[];
}

export interface DemoDatasetRequest {
  id: string;
  datasetId: string;
  datasetNombre: string;
  solicitanteId: string;
  solicitanteNombre: string;
  fecha: string;
  motivo: string;
  estado: DatasetRequestStatus;
  observacion?: string;
  revisadoPor?: string;
}

export interface DemoCohort {
  id: string;
  nombre: string;
  descripcion: string;
  pacientes: number;
  inferencias: number;
  tiRads: string;
  bethesda: string;
  fecha: string;
}

export interface DemoAuditEvent {
  id: string;
  fecha: string;
  usuario: string;
  rol: RoleKey;
  accion: string;
  detalle: string;
  ip: string;
  tipo: ActivityType;
}

export interface DemoUser {
  id: string;
  nombre: string;
  email: string;
  rol: RoleKey;
  institucion: string;
  estado: UserActivityStatus;
}

export interface DemoRolePermissions {
  rol: RoleKey;
  usuarios: number;
  permisos: string[];
}

export interface DemoSystemSummary {
  pacientes: number;
  fichas: number;
  inferencias: number;
  imagenes: number;
  usuarios: number;
}

export interface DemoTrendGroup {
  modelo: string;
  valores: number[];
}
