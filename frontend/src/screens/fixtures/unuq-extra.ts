export type UnuqAtributo =
  | 'Utilidad'
  | 'Facilidad de uso'
  | 'Facilidad de aprendizaje'
  | 'Satisfacción'
  | 'Seguridad y control'
  | 'Accesibilidad'
  | 'Confianza';

export interface UnuqAtributoInfo {
  nombre: UnuqAtributo;
  descripcion: string;
  peso: number;
}

export interface UnuqItem {
  id: number;
  atributo: UnuqAtributo;
  enunciado: string;
}

export interface UnuqParticipante {
  rol: 'Médico' | 'Investigador' | 'Administrador';
  cantidad: number;
  tareas: string[];
}

export interface UnuqAtributoResumen {
  atributo: UnuqAtributo;
  promedio: number;
  puntaje: number;
  peso: number;
}

export const unuqAtributos: UnuqAtributoInfo[] = [
  { nombre: 'Utilidad', descripcion: 'Apoya tareas reales del rol.', peso: 1 / 7 },
  { nombre: 'Facilidad de uso', descripcion: 'Interacción clara y eficiente.', peso: 1 / 7 },
  {
    nombre: 'Facilidad de aprendizaje',
    descripcion: 'Comprensible desde el primer uso.',
    peso: 1 / 7,
  },
  { nombre: 'Satisfacción', descripcion: 'Experiencia general positiva.', peso: 1 / 7 },
  { nombre: 'Seguridad y control', descripcion: 'Control sobre acciones y datos.', peso: 1 / 7 },
  { nombre: 'Accesibilidad', descripcion: 'Información legible y alcanzable.', peso: 1 / 7 },
  { nombre: 'Confianza', descripcion: 'Consistencia y trazabilidad percibida.', peso: 1 / 7 },
];

const base: Array<[UnuqAtributo, string]> = [
  ['Utilidad', 'La herramienta apoya las tareas principales de mi rol.'],
  ['Utilidad', 'La información presentada es relevante para mi trabajo.'],
  ['Utilidad', 'Los resultados ayudan a tomar decisiones informadas.'],
  ['Facilidad de uso', 'Puedo completar una tarea sin pasos innecesarios.'],
  ['Facilidad de uso', 'Las opciones disponibles son fáciles de ubicar.'],
  ['Facilidad de uso', 'La secuencia de trabajo es eficiente.'],
  ['Facilidad de aprendizaje', 'Comprendo cómo usar la interfaz desde el inicio.'],
  ['Facilidad de aprendizaje', 'Los términos clínicos y técnicos son comprensibles.'],
  ['Facilidad de aprendizaje', 'Los mensajes y etiquetas orientan mis acciones.'],
  ['Satisfacción', 'La experiencia general resulta satisfactoria.'],
  ['Satisfacción', 'Recomendaría esta experiencia para tareas similares.'],
  ['Satisfacción', 'El flujo general cumple mis expectativas.'],
  ['Seguridad y control', 'Siento control sobre las acciones que ejecuto.'],
  ['Seguridad y control', 'Puedo revisar o corregir antes de confirmar.'],
  ['Seguridad y control', 'Comprendo las consecuencias de mis acciones.'],
  ['Accesibilidad', 'La presentación reduce dudas durante la tarea.'],
  ['Accesibilidad', 'Comprendo qué significa cada estado o indicador.'],
  ['Accesibilidad', 'La navegación entre secciones es sencilla.'],
  ['Confianza', 'La información presentada inspira confianza para revisar.'],
  ['Confianza', 'Puedo verificar el origen de la información mostrada.'],
  ['Confianza', 'Confío en que los datos se presentan de forma consistente.'],
  ['Confianza', 'El tiempo para completar la tarea es razonable.'],
];

export const unuqItems: UnuqItem[] = base.map(([atributo, enunciado], index) => ({
  id: index + 1,
  atributo,
  enunciado,
}));

export const unuqParticipantes: UnuqParticipante[] = [
  {
    rol: 'Médico',
    cantidad: 4,
    tareas: ['Revisar ficha y caso', 'Interpretar resultado IA', 'Registrar conclusión clínica'],
  },
  {
    rol: 'Investigador',
    cantidad: 3,
    tareas: [
      'Consultar métricas y cohortes',
      'Revisar auditoría de modelo',
      'Exportar evidencia sintética',
    ],
  },
  {
    rol: 'Administrador',
    cantidad: 3,
    tareas: ['Gestionar usuarios y roles', 'Revisar bitácora', 'Atender solicitud de derechos'],
  },
];

export const unuqConsentimiento =
  'Acepto participar voluntariamente en esta evaluación académica de usabilidad. Comprendo que las respuestas son sintéticas en esta demostración, se usan con fines de estudio de la tesis y no modifican datos clínicos ni configuración del producto.';

export const unuqRespuestasAlta = [
  5, 4, 5, 4, 4, 5, 4, 4, 5, 4, 4, 5, 4, 5, 4, 4, 4, 5, 4, 5, 4, 4,
];
export const unuqRespuestasBaja = [
  3, 3, 2, 3, 2, 3, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2,
];

export function calcularPuntajeUnuq(respuestas: number[]): number {
  if (!respuestas.length) return 0;
  const maximo = respuestas.length * 5;
  const suma = respuestas.reduce((total, valor) => total + valor, 0);
  return Math.round((suma / maximo) * 100);
}

export function resumirAtributosUnuq(respuestas: number[]): UnuqAtributoResumen[] {
  return unuqAtributos.map(({ nombre, peso }) => {
    const valores = unuqItems
      .filter((item) => item.atributo === nombre)
      .map((item) => respuestas[item.id - 1] ?? 0);
    const promedio = valores.length
      ? Number((valores.reduce((t, v) => t + v, 0) / valores.length).toFixed(2))
      : 0;
    return { atributo: nombre, promedio, puntaje: Math.round((promedio / 5) * 100), peso };
  });
}

export const unuqFormula = 'Puntuación UnUQ = (Σ respuestas / (22 × 5)) × 100';
