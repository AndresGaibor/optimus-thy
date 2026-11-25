import { FORMATO_FECHA } from '../conclusion/compartidos';

export type TonoResultado = 'success' | 'danger' | 'neutral';

export interface PasoDelModelo {
  titulo: string;
  modelo: string;
  descripcion: string;
}

/** Cadena real de inferencia (HT-061): detector, segmentación y clasificador. */
export const PASOS_DEL_MODELO: readonly PasoDelModelo[] = [
  {
    titulo: 'Detección de nódulos',
    modelo: 'YOLO11',
    descripcion:
      'Busca regiones sospechosas en la ecografía y propone hasta tres cajas por imagen. Descarta las menores a 5 × 5 px y, si hay más de tres, conserva las de mayor confianza.',
  },
  {
    titulo: 'Delimitación del nódulo',
    modelo: 'MGAC + BGAU-Net',
    descripcion:
      'MGAC inicia el contorno del nódulo y BGAU-Net ajusta la máscara de la región que se va a clasificar. Si la máscara de BGAU-Net queda con muy pocos píxeles, se usa la de MGAC y el resultado indica cuál se aplicó.',
  },
  {
    titulo: 'Clasificación',
    modelo: 'Swin Transformer',
    descripcion:
      'Clasifica la región delimitada y devuelve la probabilidad de benigno y de maligno. La etiqueta mostrada es la de mayor probabilidad; no confirma ni descarta una enfermedad.',
  },
];

export interface SignificadoResultado {
  etiqueta: string;
  tono: TonoResultado;
  descripcion: string;
}

/** Etiquetas que produce el contrato de inferencia y cómo deben leerse. */
export const SIGNIFICADOS: readonly SignificadoResultado[] = [
  {
    etiqueta: 'Normal (sin nódulo)',
    tono: 'neutral',
    descripcion:
      'El detector no encontró nódulos, así que no se clasificó nada. Es una observación de la imagen, no una confirmación de tiroides sana.',
  },
  {
    etiqueta: 'Benigno',
    tono: 'success',
    descripcion:
      'En un nódulo detectado, la mayor probabilidad del clasificador fue benigno. No elimina la necesidad de seguimiento ni de otras pruebas indicadas por tu criterio.',
  },
  {
    etiqueta: 'Maligno',
    tono: 'danger',
    descripcion:
      'En un nódulo detectado, la mayor probabilidad del clasificador fue maligno. No es un diagnóstico de cáncer ni indica por sí solo una biopsia.',
  },
];

export interface LimiteDelModelo {
  titulo: string;
  detalle: string;
}

/** Límites que el médico debe conocer antes de interpretar el resultado (RS-IA-02). */
export const LIMITES: readonly LimiteDelModelo[] = [
  {
    titulo: 'No es un diagnóstico',
    detalle:
      'La predicción es una observación de apoyo generada por un modelo de aprendizaje profundo. No confirma ni descarta cáncer de tiroides.',
  },
  {
    titulo: 'No sustituye al especialista',
    detalle:
      'El ecografista, el patólogo y el médico tratante conservan la interpretación, las pruebas complementarias y la conducta clínica.',
  },
  {
    titulo: 'Solo ecografías tiroideas',
    detalle:
      'El modelo se entrenó para imágenes de ecografía de tiroides. No está pensado para tomografía, resonancia, mamografía, biopsias ni otras regiones del cuerpo.',
  },
  {
    titulo: 'Depende de la calidad de la imagen',
    detalle:
      'Ruido, compresión, bajo contraste, marcas de medición o recortes pueden ocultar nódulos o alterar la clasificación. Una imagen dudosa conviene repetirla o revisarla.',
  },
  {
    titulo: 'Población de entrenamiento acotada',
    detalle:
      'Los pesos provienen del modelo existente del proyecto. El sistema no documenta validación propia fuera de esa población: interpreta con cautela los casos pediátricos, gestantes, cuello operado u otras condiciones.',
  },
  {
    titulo: 'Hasta tres nódulos por imagen',
    detalle:
      'Si la imagen contiene más detecciones, solo se clasifican las tres de mayor confianza; el resto no se informa como hallazgo.',
  },
  {
    titulo: 'Sin datos clínicos del paciente',
    detalle:
      'El modelo solo mira la imagen: no usa antecedentes, TSH, laboratorio, ecografías previas ni palpación.',
  },
  {
    titulo: 'La confianza no es riesgo',
    detalle:
      'La confianza es la salida del clasificador para esa región, no la probabilidad de que el paciente tenga cáncer ni una recomendación de biopsia.',
  },
  {
    titulo: 'No aprende de tus casos',
    detalle:
      'Las inferencias y decisiones no se usan para reentrenar el modelo. Los pesos solo cambian cuando se activa otra versión registrada.',
  },
];

export const PASOS_DE_LA_DECISION: readonly string[] = [
  'Revisa la imagen, los nódulos detectados y sus probabilidades antes de concluir.',
  'Abre el formulario de conclusión de la inferencia y elige aceptar, corregir o descartar el resultado.',
  'Añade una observación cuando corrijas o descartes: la nota debe explicar el criterio clínico.',
  'La decisión se guarda una sola vez por inferencia, con autor y fecha; un segundo envío se rechaza.',
  'La conclusión no sobrescribe el resultado del modelo: queda como referencia clínica inmutable junto a la predicción.',
];

export const REGISTROS_DE_AUDITORIA: readonly string[] = [
  'Solicitud de inferencia: usuario, rol, imagen y modelo utilizado.',
  'Consulta del resultado: quién abrió la inferencia y cuándo (INFERENCE_READ).',
  'Decisión médica: categoría elegida, autor y fecha (INFERENCE_DECISION).',
  'Cambio de modelo activo: la activación de otra versión queda como cambio de ajustes (SETTINGS_CHANGE).',
  'Accesos denegados y consultas de la propia bitácora también se registran.',
];

export function formatearFecha(fechaIso: string): string {
  return FORMATO_FECHA.format(new Date(fechaIso));
}
