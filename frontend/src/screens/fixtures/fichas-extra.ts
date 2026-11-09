import type { DemoRecord } from './types';

export interface FichaSeccion {
  id: string;
  titulo: string;
  campos: { etiqueta: string; valor: string }[];
}

export interface FichaCompleta {
  registro: DemoRecord;
  secciones: FichaSeccion[];
  diagnosticoCie10: { codigo: string; descripcion: string };
  profesional: string;
  cerrada: boolean;
  cerradaEn?: string;
  cierreMotivo?: string;
}

export const fichaCompletaDemo: FichaCompleta = {
  registro: {
    id: 'DEMO-FC-010',
    pacienteId: 'DEMO-PAC-001',
    pacienteNombre: 'Paciente demo 001',
    fecha: '2026-03-18',
    tipo: 'Consulta general',
    estado: 'Completa',
    paginas: 4,
    ocrConfianza: 96,
  },
  profesional: 'Médico de demostración',
  cerrada: false,
  diagnosticoCie10: { codigo: 'E04.1', descripcion: 'Nódulo tiroideo no tóxico, único' },
  secciones: [
    {
      id: 'consulta',
      titulo: 'Consulta',
      campos: [
        { etiqueta: 'Fecha', valor: '2026-03-18' },
        { etiqueta: 'Motivo', valor: 'Control de nódulo tiroideo conocido (dato sintético).' },
        { etiqueta: 'Profesional', valor: 'Médico de demostración' },
      ],
    },
    {
      id: 'laboratorio',
      titulo: 'Laboratorio',
      campos: [
        { etiqueta: 'TSH', valor: '3,1 mUI/L' },
        { etiqueta: 'T3', valor: '1,4 ng/mL' },
        { etiqueta: 'T4', valor: '8,1 µg/dL' },
        { etiqueta: 'Laboratorio', valor: 'Laboratorio demo central' },
      ],
    },
    {
      id: 'ecografia',
      titulo: 'Ecografía',
      campos: [
        { etiqueta: 'Tamaño del nódulo', valor: '11 mm' },
        { etiqueta: 'Composición', valor: 'Sólido hipoecoico' },
        { etiqueta: 'TI-RADS', valor: '3 (probablemente benigno, demo)' },
      ],
    },
    {
      id: 'paaf',
      titulo: 'PAAF / Bethesda',
      campos: [
        { etiqueta: 'Realizada', valor: 'No' },
        { etiqueta: 'Categoría Bethesda', valor: 'No aplica' },
        { etiqueta: 'Observación', valor: 'Sin indicación en esta consulta sintética.' },
      ],
    },
    {
      id: 'antecedentes',
      titulo: 'Antecedentes',
      campos: [
        { etiqueta: 'Personales', valor: 'Sin antecedentes tiroideos relevantes (demo).' },
        { etiqueta: 'Familiares', valor: 'No refiere (demo).' },
        { etiqueta: 'Medicación', valor: 'Sin tratamiento actual (demo).' },
      ],
    },
    {
      id: 'diagnostico',
      titulo: 'Diagnóstico (CIE-10)',
      campos: [
        { etiqueta: 'Código', valor: 'E04.1' },
        { etiqueta: 'Descripción', valor: 'Nódulo tiroideo no tóxico, único' },
        {
          etiqueta: 'Nota',
          valor: 'Diagnóstico registrado por el profesional; la IA no diagnostica.',
        },
      ],
    },
  ],
};

export const fichaCerradaDemo: FichaCompleta = {
  ...fichaCompletaDemo,
  registro: { ...fichaCompletaDemo.registro, id: 'DEMO-FC-011', estado: 'Completa' },
  cerrada: true,
  cerradaEn: '2026-03-19 10:20',
  cierreMotivo: 'Revisión clínica completada (demo).',
};

export interface ValorRangoDemo {
  campo: string;
  valor: string;
  mensaje: string;
}

export const valoresFueraDeRangoDemo: ValorRangoDemo[] = [
  {
    campo: 'TSH',
    valor: '150',
    mensaje: 'TSH fuera de rango (0,01–100 mUI/L). Verifica el valor.',
  },
  { campo: 'T3', valor: '-1', mensaje: 'T3 fuera de rango (0,1–10 ng/mL). Verifica el valor.' },
  { campo: 'T4', valor: '99', mensaje: 'T4 fuera de rango (0,5–30 µg/dL). Verifica el valor.' },
  {
    campo: 'Tamaño del nódulo (mm)',
    valor: '0',
    mensaje: 'El tamaño del nódulo debe ser mayor que 0 mm. Verifica el valor.',
  },
];

export interface VersionFicha {
  id: string;
  version: number;
  autor: string;
  fecha: string;
  resumen: string;
  campos: { campo: string; valor: string }[];
}

export const versionesFichaDemo: VersionFicha[] = [
  {
    id: 'v1',
    version: 1,
    autor: 'Médico de demostración',
    fecha: '2026-03-14 09:10',
    resumen: 'Creación inicial de la ficha.',
    campos: [
      { campo: 'TSH', valor: '2,8 mUI/L' },
      { campo: 'T3', valor: '1,3 ng/mL' },
      { campo: 'T4', valor: '8,0 µg/dL' },
      { campo: 'Tamaño del nódulo', valor: '9 mm' },
      { campo: 'TI-RADS', valor: '2' },
      { campo: 'Diagnóstico (CIE-10)', valor: 'E04.1 — Nódulo tiroideo no tóxico' },
    ],
  },
  {
    id: 'v2',
    version: 2,
    autor: 'Médico revisor demo',
    fecha: '2026-03-18 11:45',
    resumen: 'Actualización tras ecografía de control.',
    campos: [
      { campo: 'TSH', valor: '3,1 mUI/L' },
      { campo: 'T3', valor: '1,4 ng/mL' },
      { campo: 'T4', valor: '8,1 µg/dL' },
      { campo: 'Tamaño del nódulo', valor: '11 mm' },
      { campo: 'TI-RADS', valor: '3' },
      { campo: 'Diagnóstico (CIE-10)', valor: 'E04.1 — Nódulo tiroideo no tóxico, único' },
    ],
  },
];
