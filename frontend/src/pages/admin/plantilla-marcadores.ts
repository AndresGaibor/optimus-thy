/**
 * Marcadores y textos del correo de recuperación.
 *
 * Los marcadores se escriben con dos llaves; aquí viven su lista, la muestra con
 * datos de ejemplo y el aviso de uno mal escrito.
 */
export const VARIABLES = [
  { clave: 'nombre', etiqueta: 'Nombre', ejemplo: 'Ana Pérez' },
  { clave: 'enlace', etiqueta: 'Enlace', ejemplo: '#' },
  { clave: 'expira_en', etiqueta: 'Caducidad', ejemplo: '30 minutos' },
];

export const VARIABLES_HTML = VARIABLES.map((fila) => fila.clave);

/** Un campo del correo: qué dice y qué marcadores admite. */
export interface CampoPlantilla {
  clave: string;
  etiqueta: string;
  ayuda: string;
  filas: number;
  variables: string[];
}

/** El asunto se edita como un campo más, y admite el nombre de quien lo recibe. */
export const ASUNTO_CAMPO: CampoPlantilla = {
  clave: 'asunto',
  etiqueta: 'Asunto',
  ayuda: 'Lo que se lee en la bandeja antes de abrir el correo.',
  filas: 0,
  variables: ['nombre'],
};

/** Campos que componen el correo, en el orden en que se leen. */
export const CAMPOS: CampoPlantilla[] = [
  {
    clave: 'titulo',
    etiqueta: 'Encabezado',
    ayuda: 'El título grande del correo.',
    filas: 0,
    variables: [],
  },
  {
    clave: 'mensaje',
    etiqueta: 'Mensaje',
    ayuda: 'El saludo con el nombre se añade solo; aquí va lo que quieras contar.',
    filas: 3,
    variables: ['nombre'],
  },
  {
    clave: 'boton',
    etiqueta: 'Texto del botón',
    ayuda: 'El botón lleva al enlace de recuperación; no hace falta pegarlo.',
    filas: 0,
    variables: [],
  },
  {
    clave: 'nota',
    etiqueta: 'Nota del enlace',
    ayuda: 'Se muestra bajo el botón. Añade la caducidad para que se rellene sola.',
    filas: 2,
    variables: ['expira_en'],
  },
  {
    clave: 'pie',
    etiqueta: 'Pie',
    ayuda: 'Cierre del mensaje, por ejemplo qué hacer si no lo solicitó.',
    filas: 2,
    variables: [],
  },
];

/** Marcadores con una llave o con mayúsculas: el envío los dejaría tal cual. */
const MARCADOR_ROTO = /(?:{{[^}]*}}|(?<!\{)\{[a-zA-Z_]+\}(?!\}))/;

/** Sustituye los marcadores por datos de ejemplo para mostrar cómo se verá. */
export function previa(texto: string): string {
  return texto.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_coincidencia, clave: string) => {
    const fila = VARIABLES.find((variable) => variable.clave === clave);
    return fila ? fila.ejemplo : '';
  });
}

/** Devuelve el mensaje de error si la plantilla usa una variable inexistente. */
export function verificarVariables(texto: string): string | null {
  const usadas = [...texto.matchAll(/\{\{\s*([a-z_]+)\s*\}\}/g)].map((fila) => fila[1]);
  const desconocida = usadas.find((clave) => !VARIABLES_HTML.includes(clave ?? ''));
  return desconocida ? `La variable {{${desconocida}}} no existe.` : null;
}

/** Texto del aviso cuando un marcador está mal escrito. */
export function avisoMarcador(texto: string): string | null {
  const conocidos = /\{\{\s*(nombre|enlace|expira_en)\s*\}\}/g;
  const sinConocidos = texto.replace(conocidos, '');
  return MARCADOR_ROTO.test(sinConocidos)
    ? 'Los marcadores se escriben con dos llaves: {{nombre}} o {{expira_en}}.'
    : null;
}
