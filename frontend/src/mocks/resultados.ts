/** Fixtures sintéticas de resultados guardados para MSW y Storybook. */

export const resultadosOk = {
  total: 2,
  items: [
    {
      id: 'inf-001',
      imagen_id: 'img-001',
      modelo: { id: 'mod-1', nombre: 'Swin', version: '1.0' },
      resultado: 'maligno',
      confianza: 0.87,
      tiempo_ms: 11800,
      ancho: 1024,
      alto: 768,
      version_contrato: '1.1',
      huella_modelos: 'a'.repeat(64),
      umbrales: { max_nodulos: 3 },
      creado_en: '2026-06-10T14:30:00Z',
      nodulos: [],
      caso_id: 'caso-001',
      caso_codigo: 'CASO-0001',
      paciente_codigo: 'PAC-0001',
    },
    {
      id: 'inf-002',
      imagen_id: 'img-002',
      modelo: { id: 'mod-1', nombre: 'Swin', version: '1.0' },
      resultado: 'sin_nodulo',
      confianza: null,
      tiempo_ms: 9400,
      ancho: 1024,
      alto: 768,
      version_contrato: '1.1',
      huella_modelos: 'a'.repeat(64),
      umbrales: { max_nodulos: 3 },
      creado_en: '2026-06-09T10:15:00Z',
      nodulos: [],
      caso_id: 'caso-002',
      caso_codigo: 'CASO-0002',
      paciente_codigo: 'PAC-0002',
    },
  ],
};

export const resultadosVacios = { total: 0, items: [] };
