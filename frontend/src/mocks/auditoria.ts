/** Fixtures sintéticas de la bitácora para MSW y Storybook. */

export const eventosOk = {
  total: 2,
  items: [
    {
      id: 12,
      ocurrido_en: '2026-06-10T14:32:00Z',
      usuario_id: 'u-ana',
      accion: 'AUTH.SESSION_START',
      entidad: 'USER',
      entidad_id: 'u-ana',
      direccion_ip: '127.0.0.1',
      detalles: { role_code: 'admin' },
    },
    {
      id: 11,
      ocurrido_en: '2026-06-10T14:30:00Z',
      usuario_id: 'u-luis',
      accion: 'INFERENCE.INFERENCE_READ',
      entidad: 'INFERENCE',
      entidad_id: 'inf-001',
      direccion_ip: '127.0.0.1',
      detalles: { resource_count: 2 },
    },
  ],
};

export const eventosVacios = { total: 0, items: [] };
