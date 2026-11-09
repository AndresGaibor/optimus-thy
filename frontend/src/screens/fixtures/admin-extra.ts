import type { DemoAuditEvent, DemoUser } from './types';

export interface DemoInstitution {
  id: string;
  codigo: string;
  nombre: string;
  usuariosActivos: number;
  estado: 'Activa' | 'Inactiva';
}

export interface DemoUserWithRoles extends DemoUser {
  roles: Array<'medico' | 'investigador' | 'administrador'>;
  rolActivo: 'medico' | 'investigador' | 'administrador';
}

export interface DemoAuditExportFilter {
  busqueda: string;
  tipo: string;
  desde: string;
  hasta: string;
  total: number;
}

const institutions: DemoInstitution[] = [
  {
    id: 'DEMO-INST-001',
    codigo: 'HGS-RIO',
    nombre: 'Hospital General Sintético de Riobamba',
    usuariosActivos: 4,
    estado: 'Activa',
  },
  {
    id: 'DEMO-INST-002',
    codigo: 'CLI-NOR',
    nombre: 'Clínica Norte de Demostración',
    usuariosActivos: 2,
    estado: 'Activa',
  },
  {
    id: 'DEMO-INST-003',
    codigo: 'LAB-CEN',
    nombre: 'Laboratorio Central de Ejemplo',
    usuariosActivos: 0,
    estado: 'Inactiva',
  },
];

const usersWithRoles: DemoUserWithRoles[] = [
  {
    id: 'DEMO-USR-010',
    nombre: 'Usuario demo multirol 010',
    email: 'multirol.demo@example.test',
    rol: 'medico',
    roles: ['medico', 'investigador'],
    rolActivo: 'medico',
    institucion: 'Institución demo',
    estado: 'Activo',
  },
  {
    id: 'DEMO-USR-011',
    nombre: 'Usuario demo multirol 011',
    email: 'coordinacion.demo@example.test',
    rol: 'investigador',
    roles: ['investigador', 'administrador', 'medico'],
    rolActivo: 'investigador',
    institucion: 'Institución demo',
    estado: 'Activo',
  },
];

const exportAuditEvent: DemoAuditEvent = {
  id: 'DEMO-AUD-EXP-001',
  fecha: '2026-11-08 12:00',
  usuario: 'Usuario demo 003',
  rol: 'administrador',
  accion: 'Exportó bitácora de auditoría',
  detalle: 'Formato CSV con filtros aplicados.',
  ip: '192.0.2.13',
  tipo: 'exportacion',
};

const defaultExportFilter: DemoAuditExportFilter = {
  busqueda: '',
  tipo: 'todos',
  desde: '2026-03-16',
  hasta: '2026-03-18',
  total: 5,
};

export const adminExtraFixtures = {
  institutions,
  usersWithRoles,
  exportAuditEvent,
  defaultExportFilter,
};
export const serviceStatuses = [
  { name: 'API clínica', status: 'Operativo', detail: 'Última respuesta: 42 ms' },
  { name: 'Almacenamiento de imágenes', status: 'Operativo', detail: 'Espacio disponible: 68 %' },
  {
    name: 'Servicio de inferencia',
    status: 'Degradado',
    detail: 'Latencia elevada; reintento automático en curso',
  },
];

export const dataVolume = {
  pacientes: 1284,
  fichas: 3260,
  imagenes: 9172,
  inferencias: 2841,
};

export const auditSecondPageEvents: DemoAuditEvent[] = Array.from({ length: 20 }, (_, index) => ({
  id: `DEMO-AUD-P2-${String(index + 1).padStart(3, '0')}`,
  fecha: `2026-11-${String(7 - Math.floor(index / 10)).padStart(2, '0')} ${String(9 + (index % 10)).padStart(2, '0')}:00`,
  usuario: index % 2 === 0 ? 'Dra. Elena Ríos' : 'Dr. Mateo Silva',
  rol: 'administrador',
  accion: `Consulta de auditoría ${index + 1}`,
  detalle: 'Evento sintético de la segunda página de bitácora.',
  ip: '192.0.2.21',
  tipo: 'lectura',
}));
