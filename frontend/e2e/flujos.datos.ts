import type { AuthSession } from '../src/api/auth';

export const ids = {
  paciente: 'paciente-e2e-001',
  caso: 'caso-e2e-001',
  imagen: 'imagen-e2e-001',
  inferencia: 'inferencia-e2e-001',
  trabajo: 'trabajo-e2e-001',
  dataset: 'dataset-e2e-001',
} as const;

const fecha = '2026-11-26T12:00:00Z';

export function sesionDe(rol: 'medico' | 'investigador'): AuthSession {
  const medico = rol === 'medico';
  const rolBackend = medico ? 'doctor' : 'researcher';
  return {
    usuario: {
      id: medico ? 'usuario-medico-e2e' : 'usuario-investigador-e2e',
      correo: medico ? 'medico.e2e@example.test' : 'investigador.e2e@example.test',
      nombre: medico ? 'Médica de prueba' : 'Investigador de prueba',
    },
    roles: [rolBackend],
    rol_activo: rolBackend,
    permisos: ['paciente.leer', 'paciente.archivar', 'caso.leer', 'inferencia.ejecutar'],
    segundos_para_expirar: 3600,
    segundo_factor_activo: false,
  };
}

const datasetResumen = {
  id: ids.dataset,
  nombre: 'Cohorte sintética de nódulos tiroideos',
  descripcion: 'Muestra anonimizada para pruebas automatizadas.',
  total_casos: 20,
  k: 5,
  k_efectivo: 20,
  huella: 'e2e-sintetica-0123456789abcdef',
  criterios: {},
  creado_en: fecha,
};

const filaAnonimizada = {
  sujeto: 'sujeto-e2e-001',
  edad_rango: '40-49',
  mes_caso: '2026-11',
  mes_tsh: null,
  tsh: 2.1,
  tsh_unidad: 'mUI/L',
  mes_t3: null,
  t3: null,
  t3_unidad: null,
  mes_t4: null,
  t4: null,
  t4_unidad: null,
  tamano_nodulo_mm: 12,
  lateralidad: 'derecha',
  tirads: 'TR3',
  bethesda: null,
  cie10: null,
  tipo_diagnostico: 'ecográfico',
  tipo_consulta: 'control',
};

export const datos = {
  paciente: {
    id: ids.paciente,
    codigo: 'PAC-E2E-001',
    creado_en: fecha,
    total_casos: 1,
    archivado_en: null,
  },
  pacienteDetalle: {
    id: ids.paciente,
    codigo: 'PAC-E2E-001',
    creado_en: fecha,
    total_casos: 1,
    archivado_en: null,
    casos: [{ id: ids.caso, codigo: 'CAS-E2E-001', creado_en: fecha }],
  },
  caso: {
    id: ids.caso,
    codigo: 'CAS-E2E-001',
    paciente_id: ids.paciente,
    paciente_codigo: 'PAC-E2E-001',
    creado_en: fecha,
    tiene_ficha: false,
    documentos: 0,
    imagenes: 1,
    consentimientos: 1,
  },
  imagen: {
    id: ids.imagen,
    caso_id: ids.caso,
    sha256: 'e2e-sintetica-imagen',
    formato: 'png',
    ancho: 640,
    alto: 480,
    tamano_bytes: 1024,
    sin_metadatos_exif_dicom: true,
    creado_en: fecha,
    url: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22640%22 height=%22480%22/%3E',
    url_expira_en: 1893456000,
  },
  consentimiento: {
    id: 'consentimiento-e2e-001',
    caso_id: ids.caso,
    base_legal: 'atencion_de_salud',
    version_texto: 'e2e-v1',
    otorgado_en: fecha,
    revocado_en: null,
    vigente: true,
  },
  inferencia: {
    id: ids.inferencia,
    imagen_id: ids.imagen,
    modelo: { id: 'modelo-e2e-001', nombre: 'Modelo sintético', version: '1.0.0' },
    resultado: 'maligno',
    confianza: 0.72,
    tiempo_ms: 120,
    ancho: 640,
    alto: 480,
    version_contrato: '1',
    huella_modelos: 'e2e-sintetica-modelo',
    umbrales: {},
    creado_en: fecha,
    nodulos: [
      {
        indice: 1,
        clase: 'maligno',
        confianza: 0.72,
        probabilidad_benigno: 0.28,
        probabilidad_maligno: 0.72,
        caja: { x: 120, y: 90, w: 80, h: 70 },
        region_analizada: null,
        pixeles_mascara: null,
        artefactos: { mascara_url: null, mgac_url: null, xml_url: null, superposicion_url: null },
      },
    ],
  },
  trabajoPendiente: {
    id: ids.trabajo,
    tipo: 'inferencia',
    estado: 'pendiente',
    intentos: 0,
    max_intentos: 3,
  },
  trabajoCompletado: {
    id: ids.trabajo,
    tipo: 'inferencia',
    estado: 'completado',
    intentos: 1,
    max_intentos: 3,
  },
  estadoFicha: {
    caso_id: ids.caso,
    registrada: false,
    cerrada_en: null,
    cerrada_por_id: null,
    cerrada_por_nombre: null,
  },
  metricas: {
    modelo: {
      id: 'modelo-e2e-investigacion',
      nombre: 'Modelo sintético',
      version: '1.0.0',
      hash_pesos: 'e2e-sintetica-huella-modelo',
    },
    total: 20,
    acepta: 14,
    corrige: 3,
    descarta: 2,
    pendiente: 1,
    acuerdo: 0.7,
    por_resultado: [
      { resultado: 'maligno', total: 10, acepta: 7, corrige: 2, descarta: 1, pendiente: 0 },
      { resultado: 'benigno', total: 10, acepta: 7, corrige: 1, descarta: 1, pendiente: 1 },
    ],
  },
  datasetResumen,
  dataset: { ...datasetResumen, items: [filaAnonimizada] },
};
