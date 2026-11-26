export type CasoEstado = 'Activo' | 'Cerrado';

export interface CasoDocumento {
  id: string;
  nombre: string;
  tipo: string;
  fecha: string;
  enlace: string;
}

export interface CasoImagen {
  id: string;
  nombre: string;
  modalidad: string;
  fecha: string;
  enlace: string;
}

export interface CasoInferencia {
  id: string;
  resultado: string;
  confianza: number;
  fecha: string;
  enlace: string;
}

export interface CasoFicha {
  motivo: string;
  antecedentes: string;
  hallazgos: string;
  plan: string;
}

export interface CasoClinico {
  id: string;
  codigo: string;
  paciente: string;
  estado: CasoEstado;
  fechaApertura: string;
  responsable: string;
  ficha: CasoFicha;
  documentos: CasoDocumento[];
  imagenes: CasoImagen[];
  inferencias: CasoInferencia[];
}

export type DerechoTipo = 'Acceso' | 'Rectificación' | 'Supresión' | 'Oposición';

export interface SolicitudDerecho {
  id: string;
  fecha: string;
  tipo: DerechoTipo;
  responsable: string;
  titular: string;
}

export const casosClinicos: CasoClinico[] = [
  {
    id: 'DEMO-CASO-001',
    codigo: 'CASO-TIR-001',
    paciente: 'Paciente demo 001',
    estado: 'Activo',
    fechaApertura: '2026-10-02',
    responsable: 'Dra. Demo Profesional',
    ficha: {
      motivo: 'Seguimiento de nódulo tiroideo sintético detectado en control anual.',
      antecedentes: 'Antecedente familiar ilustrativo, sin datos reales de salud.',
      hallazgos: 'Nódulo sólido de bordes regulares en lóbulo derecho, pendiente de correlación.',
      plan: 'Revisión de laboratorio, imágenes y apoyo de inferencia antes de decisión clínica.',
    },
    documentos: [
      {
        id: 'DOC-101',
        nombre: 'Informe de ecografía',
        tipo: 'Informe',
        fecha: '2026-10-03',
        enlace: 'Documentos',
      },
      {
        id: 'DOC-102',
        nombre: 'Orden de laboratorio',
        tipo: 'Orden',
        fecha: '2026-10-04',
        enlace: 'Documentos',
      },
    ],
    imagenes: [
      {
        id: 'IMG-201',
        nombre: 'Ecografía tiroidea serie A',
        modalidad: 'Ecografía',
        fecha: '2026-10-03',
        enlace: 'Imágenes',
      },
    ],
    inferencias: [
      {
        id: 'INF-301',
        resultado: 'Hallazgo compatible con seguimiento',
        confianza: 0.84,
        fecha: '2026-10-05',
        enlace: 'Resultados',
      },
    ],
  },
  {
    id: 'DEMO-CASO-002',
    codigo: 'CASO-TIR-002',
    paciente: 'Paciente demo 001',
    estado: 'Cerrado',
    fechaApertura: '2026-06-12',
    responsable: 'Dr. Demo Revisor',
    ficha: {
      motivo: 'Control previo cerrado con evolución estable.',
      antecedentes: 'Sin cambios reportados en el episodio ilustrativo anterior.',
      hallazgos: 'Sin hallazgos nuevos relevantes en el cierre de caso.',
      plan: 'Alta del episodio con recomendación de control programado.',
    },
    documentos: [
      {
        id: 'DOC-103',
        nombre: 'Resumen de alta',
        tipo: 'Resumen',
        fecha: '2026-06-20',
        enlace: 'Documentos',
      },
    ],
    imagenes: [],
    inferencias: [
      {
        id: 'INF-302',
        resultado: 'Sin nódulo dominante reportado',
        confianza: 0.91,
        fecha: '2026-06-18',
        enlace: 'Resultados',
      },
    ],
  },
];

export const fechaReferenciaDerechos = '2026-11-08';

export const solicitudesDerechos: SolicitudDerecho[] = [
  {
    id: 'DER-001',
    fecha: '2026-10-20',
    tipo: 'Acceso',
    responsable: 'Ana Coordinación',
    titular: 'Titular demo 014',
  },
  {
    id: 'DER-002',
    fecha: '2026-10-28',
    tipo: 'Rectificación',
    responsable: 'Luis Cumplimiento',
    titular: 'Titular demo 021',
  },
  {
    id: 'DER-003',
    fecha: '2026-09-10',
    tipo: 'Supresión',
    responsable: 'Ana Coordinación',
    titular: 'Titular demo 003',
  },
];
