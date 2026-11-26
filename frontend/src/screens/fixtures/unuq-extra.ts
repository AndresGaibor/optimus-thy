export type UnuqAtributo =
  | 'Efectividad'
  | 'Eficiencia'
  | 'Satisfacción'
  | 'Aprendizaje y memoria'
  | 'Accesibilidad'
  | 'Usabilidad'
  | 'Aceptación';

export interface UnuqAtributoInfo {
  nombre: UnuqAtributo;
  descripcion: string;
  peso: number;
}

export interface UnuqItem {
  id: number;
  atributo: UnuqAtributo;
  enunciado: string;
  invertido: boolean;
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

/** Atributos y enunciados del UnUQ publicados en el artículo de referencia. */
export const unuqAtributos: UnuqAtributoInfo[] = [
  { nombre: 'Efectividad', descripcion: 'El sistema permite completar las tareas.', peso: 1 / 7 },
  { nombre: 'Eficiencia', descripcion: 'La tarea se completa rápido y sin ayuda.', peso: 1 / 7 },
  { nombre: 'Satisfacción', descripcion: 'Experiencia general positiva.', peso: 1 / 7 },
  {
    nombre: 'Aprendizaje y memoria',
    descripcion: 'Comprensible y recordable tras un periodo sin uso.',
    peso: 1 / 7,
  },
  {
    nombre: 'Accesibilidad',
    descripcion: 'Información legible y alcanzable con ajustes.',
    peso: 1 / 7,
  },
  { nombre: 'Usabilidad', descripcion: 'Herramientas suficientes para el trabajo.', peso: 1 / 7 },
  { nombre: 'Aceptación', descripcion: 'Disposición a seguir usando el sistema.', peso: 1 / 7 },
];

const base: Array<[string, string]> = [
  ['Efectividad', 'El sistema me ayudó a completar mis tareas.'],
  ['Efectividad', 'Me resultó fácil resolver problemas con este sistema.'],
  ['Efectividad', 'El sistema presentó fallos durante su uso.'],
  ['Eficiencia', 'El sistema completó mis tareas con rapidez.'],
  ['Eficiencia', 'El sistema facilitó el acceso a la información y a los recursos.'],
  ['Eficiencia', 'Necesité apoyo de otra persona para usar el sistema.'],
  ['Satisfacción', 'Estoy satisfecho con la facilidad de uso del sistema.'],
  ['Satisfacción', 'El sistema me causó frustración.'],
  ['Satisfacción', 'La interfaz del sistema cumplió mis expectativas.'],
  ['Aprendizaje y memoria', 'Las instrucciones del sistema facilitaron mi aprendizaje.'],
  ['Aprendizaje y memoria', 'El sistema fue fácil de entender.'],
  ['Aprendizaje y memoria', 'El sistema facilitó la adquisición de habilidades para mis tareas.'],
  [
    'Aprendizaje y memoria',
    'Me cuesta recordar cómo funciona el sistema tras un periodo sin usarlo.',
  ],
  [
    'Accesibilidad',
    'El sistema es accesible para personas con dificultades visuales, auditivas o de aprendizaje.',
  ],
  ['Accesibilidad', 'El sistema permitió ajustar el tamaño del texto, los colores y las imágenes.'],
  ['Accesibilidad', 'Encontré difícil usar el sistema por problemas de navegación.'],
  ['Usabilidad', 'El sistema ofreció las herramientas necesarias para cumplir mi trabajo.'],
  [
    'Usabilidad',
    'El sistema careció de funciones esenciales para realizar mis tareas con eficacia.',
  ],
  ['Usabilidad', 'El sistema facilitó mi trabajo.'],
  ['Aceptación', 'Estaría dispuesto a seguir usando este sistema con regularidad.'],
  ['Aceptación', 'El sistema aportó valor a mis tareas diarias.'],
  ['Aceptación', 'Me sentí incómodo al usar este sistema.'],
];

/** Los siete ítems negativos del artículo (S3, S6, S8, S13, S16, S18, S22). */
export const unuqItemsInvertidos = new Set([3, 6, 8, 13, 16, 18, 22]);

export const unuqItems: UnuqItem[] = base.map(([atributo, enunciado], index) => ({
  id: index + 1,
  atributo: atributo as UnuqAtributo,
  enunciado,
  invertido: unuqItemsInvertidos.has(index + 1),
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

/** Contribución 0–4 de una respuesta 1–5; los ítems negativos se invierten. */
export function contribucionUnuq(id: number, valor: number): number {
  return unuqItemsInvertidos.has(id) ? 5 - valor : valor - 1;
}

export function calcularPuntajeUnuq(respuestas: number[]): number {
  if (!respuestas.length) return 0;
  const maximo = respuestas.length * 4;
  return Math.round((sumaContribucionesUnuq(respuestas) / maximo) * 100);
}

export function sumaContribucionesUnuq(respuestas: number[]): number {
  return respuestas.reduce((suma, valor, indice) => suma + contribucionUnuq(indice + 1, valor), 0);
}

export function resumirAtributosUnuq(respuestas: number[]): UnuqAtributoResumen[] {
  return unuqAtributos.map(({ nombre, peso }) => {
    const valores = unuqItems
      .filter((item) => item.atributo === nombre)
      .map((item) => contribucionUnuq(item.id, respuestas[item.id - 1] ?? 1));
    const promedio = valores.length
      ? Number((valores.reduce((t, v) => t + v, 0) / valores.length).toFixed(2))
      : 0;
    return { atributo: nombre, promedio, puntaje: Math.round((promedio / 4) * 100), peso };
  });
}

export const unuqFormula =
  'Puntuación UnUQ = (Σ contribuciones / 88) × 100, con contribución = respuesta − 1 y 5 − respuesta en S3, S6, S8, S13, S16, S18 y S22';
