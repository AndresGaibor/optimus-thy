import type {
  DemoAuditEvent,
  DemoDatasetRequest,
  DemoRolePermissions,
  DemoSystemSummary,
  DemoUser,
} from './types';

const users: DemoUser[] = [
  {
    id: 'DEMO-USR-001',
    nombre: 'Usuario demo 001',
    email: 'medico.demo@example.test',
    rol: 'medico',
    institucion: 'Institución demo',
    estado: 'Activo',
  },
  {
    id: 'DEMO-USR-002',
    nombre: 'Usuario demo 002',
    email: 'investigador.demo@example.test',
    rol: 'investigador',
    institucion: 'Institución demo',
    estado: 'Activo',
  },
  {
    id: 'DEMO-USR-003',
    nombre: 'Usuario demo 003',
    email: 'administrador.demo@example.test',
    rol: 'administrador',
    institucion: 'Institución demo',
    estado: 'Activo',
  },
  {
    id: 'DEMO-USR-004',
    nombre: 'Usuario demo 004',
    email: 'usuario.inactivo@example.test',
    rol: 'medico',
    institucion: 'Institución demo',
    estado: 'Inactivo',
  },
];

const activity: DemoAuditEvent[] = [
  {
    id: 'DEMO-AUD-001',
    fecha: '2026-03-18 10:20',
    usuario: 'Usuario demo 001',
    rol: 'medico',
    accion: 'Consultó registro sintético',
    detalle: 'Apertura de DEMO-HC-001.',
    ip: '192.0.2.10',
    tipo: 'lectura',
  },
  {
    id: 'DEMO-AUD-002',
    fecha: '2026-03-18 09:45',
    usuario: 'Usuario demo 002',
    rol: 'investigador',
    accion: 'Exportó datos sintéticos',
    detalle: 'Conjunto DEMO-DS-001.',
    ip: '192.0.2.11',
    tipo: 'exportacion',
  },
  {
    id: 'DEMO-AUD-003',
    fecha: '2026-03-17 16:35',
    usuario: 'Usuario demo 001',
    rol: 'medico',
    accion: 'Solicitó inferencia de muestra',
    detalle: 'DEMO-INF-001 · actividad ilustrativa.',
    ip: '192.0.2.12',
    tipo: 'inferencia',
  },
  {
    id: 'DEMO-AUD-004',
    fecha: '2026-03-17 14:10',
    usuario: 'Usuario demo 003',
    rol: 'administrador',
    accion: 'Revisó una solicitud de muestra',
    detalle: 'Cambio de estado ilustrativo.',
    ip: '192.0.2.13',
    tipo: 'administracion',
  },
  {
    id: 'DEMO-AUD-005',
    fecha: '2026-03-16 11:05',
    usuario: 'Usuario demo 002',
    rol: 'investigador',
    accion: 'Consultó auditoría sintética',
    detalle: 'Filtro por tipo de actividad.',
    ip: '192.0.2.14',
    tipo: 'auditoria',
  },
];

const rolePermissions: DemoRolePermissions[] = [
  {
    rol: 'medico',
    usuarios: 2,
    permisos: [
      'Ver registros asignados de demostración',
      'Revisar campos extraídos por OCR',
      'Solicitar apoyo de inferencia',
      'Consultar resultados ilustrativos',
      'Abrir reportes sintéticos',
      'Revisar actividad propia',
    ],
  },
  {
    rol: 'investigador',
    usuarios: 1,
    permisos: [
      'Ver datos sintéticos agregados',
      'Consultar métricas ilustrativas',
      'Solicitar datasets de demostración',
      'Explorar cohortes sintéticas',
      'Comparar categorías de muestra',
      'Exportar datos de demostración',
    ],
  },
  {
    rol: 'administrador',
    usuarios: 1,
    permisos: [
      'Gestionar usuarios de demostración',
      'Revisar solicitudes sintéticas',
      'Consultar actividad administrativa',
      'Configurar preferencias de muestra',
      'Revisar controles del sistema',
      'Exportar registros sintéticos',
    ],
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
    observacion: 'Aprobación ilustrativa para la pantalla.',
    revisadoPor: 'Administrador demo 001',
  },
  {
    id: 'DEMO-SOL-003',
    datasetId: 'DEMO-DS-003',
    datasetNombre: 'Conjunto sintético C',
    solicitanteId: 'DEMO-USR-002',
    solicitanteNombre: 'Investigador demo 001',
    fecha: '2026-03-05',
    motivo: 'Solicitud sintética adicional.',
    estado: 'rechazado',
    observacion: 'Motivo de muestra: el conjunto no está disponible.',
    revisadoPor: 'Administrador demo 001',
  },
];

const summary: DemoSystemSummary = {
  pacientes: 3,
  fichas: 4,
  inferencias: 4,
  imagenes: 3,
  usuarios: users.length,
};

export const adminFixtures = {
  users,
  activity,
  rolePermissions,
  datasetRequests,
  summary,
  settings: {
    systemName: 'OPTIMUS-THY · demostración',
    institution: 'Institución demo',
    language: 'Español',
    mfa: 'Obligatorio',
    sessionTimeout: '30 minutos',
    encryption: true,
    storageProvider: 'Local de demostración',
    uploadLimitMb: 20,
    notifications: {
      completedInference: true,
      failedAccess: true,
      newUser: false,
      securityAlert: true,
    },
  },
};
