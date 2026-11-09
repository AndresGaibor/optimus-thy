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

export type UnuqAtributo =
  | 'Utilidad'
  | 'Facilidad de uso'
  | 'Claridad'
  | 'Confianza'
  | 'Eficiencia'
  | 'Control'
  | 'Satisfacción';

export interface UnuqItem {
  id: number;
  atributo: UnuqAtributo;
  enunciado: string;
}

export interface UnuqAtributoResumen {
  atributo: UnuqAtributo;
  promedio: number;
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

export const unuqAtributos: UnuqAtributo[] = [
  'Utilidad',
  'Facilidad de uso',
  'Claridad',
  'Confianza',
  'Eficiencia',
  'Control',
  'Satisfacción',
];

const unuqEnunciados = [
  'La herramienta apoya las tareas principales del rol.',
  'Puedo completar una tarea sin pasos innecesarios.',
  'Los términos clínicos y técnicos son comprensibles.',
  'La información presentada inspira confianza para revisar.',
  'La interfaz permite avanzar con rapidez en tareas frecuentes.',
  'Siento control sobre las acciones que ejecuto.',
  'La experiencia general resulta satisfactoria.',
  'Los resultados ayudan a tomar decisiones informadas.',
  'Las opciones disponibles son fáciles de ubicar.',
  'Los mensajes y etiquetas son claros.',
  'Puedo verificar el origen de la información mostrada.',
  'La secuencia de trabajo es eficiente.',
  'Puedo corregir o revisar acciones antes de confirmar.',
  'Recomendaría esta experiencia para tareas similares.',
  'La pantalla responde a lo que necesito hacer.',
  'La navegación entre secciones es sencilla.',
  'Comprendo qué significa cada estado o indicador.',
  'Confío en que los datos se presentan de forma consistente.',
  'El tiempo para completar la tarea es razonable.',
  'Puedo entender las consecuencias de mis acciones.',
  'La presentación reduce dudas durante la tarea.',
  'El flujo general cumple mis expectativas.',
] as const;

export const unuqItems: UnuqItem[] = unuqEnunciados.map((enunciado, index) => ({
  id: index + 1,
  atributo: unuqAtributos[index % unuqAtributos.length]!,
  enunciado,
}));

export const unuqRespuestasAlta = unuqItems.map(() => 4);
export const unuqRespuestasBaja = unuqItems.map((_, index) => (index % 3 === 0 ? 2 : 3));

export function calcularPuntajeUnuq(respuestas: number[]): number {
  if (!respuestas.length) return 0;
  const maximo = respuestas.length * 5;
  const suma = respuestas.reduce((total, valor) => total + valor, 0);
  return Math.round((suma / maximo) * 100);
}

export function resumirAtributosUnuq(respuestas: number[]): UnuqAtributoResumen[] {
  return unuqAtributos.map((atributo) => {
    const valores = unuqItems
      .filter((item) => item.atributo === atributo)
      .map((item) => respuestas[item.id - 1] ?? 0);
    const promedio = valores.length
      ? Number((valores.reduce((total, valor) => total + valor, 0) / valores.length).toFixed(1))
      : 0;
    return { atributo, promedio };
  });
}

export const casosExtraFixtures = {
  casosClinicos,
  solicitudesDerechos,
  unuqItems,
  unuqAtributos,
  unuqRespuestasAlta,
  unuqRespuestasBaja,
  calcularPuntajeUnuq,
  resumirAtributosUnuq,
};
