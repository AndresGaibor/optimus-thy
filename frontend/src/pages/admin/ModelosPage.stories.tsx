import { http, HttpResponse, delay } from 'msw';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within, userEvent } from 'storybook/test';
import { crearHandlers } from '../../mocks/handlers';
import { ModelosPage } from './ModelosPage';

const modelosDemo = [
  {
    id: 'modelo-demo-activo',
    nombre: 'Nódulo demo',
    version: '1.2.0',
    hash_pesos: 'a1b2c3d4e5f67890-demo',
    ruta_pesos: null,
    activo: true,
    creado_en: '2026-05-10T09:00:00Z',
  },
  {
    id: 'modelo-demo-inactivo',
    nombre: 'Nódulo demo',
    version: '1.1.0',
    hash_pesos: '0987fedcba654321-demo',
    ruta_pesos: null,
    activo: false,
    creado_en: '2026-04-10T09:00:00Z',
  },
];
const meta = {
  title: 'Aplicación/Administrador/Modelos de IA',
  component: ModelosPage,
  parameters: { router: { initialEntries: ['/administrador/modelos'] } },
  tags: ['ai-generated'],
} satisfies Meta<typeof ModelosPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const handlersModelos = (escenario: 'lista' | 'vacio' | 'error' | 'cargando') => [
  ...crearHandlers('ok'),
  http.get(/\/modelos-ia$/, async () => {
    if (escenario === 'cargando') await delay('infinite');
    if (escenario === 'error')
      return HttpResponse.json(
        { error: { code: 'error', message: 'Error de prueba' } },
        { status: 500 },
      );
    return HttpResponse.json(escenario === 'vacio' ? [] : modelosDemo);
  }),
  http.post(/\/modelos-ia\/[^/]+\/activar$/, () =>
    HttpResponse.json({ ...modelosDemo[1], activo: true }),
  ),
  http.post(/\/modelos-ia$/, () => HttpResponse.json(modelosDemo[0], { status: 201 })),
];

export const Lista: Story = {
  parameters: { msw: { handlers: handlersModelos('lista') } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('table', { name: 'Modelos de IA' });
    await expect(canvas.getByText('Activo')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Subir modelos' }));
    await expect(
      await within(document.body).findByRole('dialog', { name: 'Subir modelos' }),
    ).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await userEvent.click(canvas.getByRole('button', { name: 'Activar' }));
    const dialog = await within(document.body).findByRole('dialog', { name: 'Activar modelo' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmar activación' }));
    await expect(await canvas.findByText('Se activó Nódulo demo 1.1.0.')).toBeInTheDocument();
  },
};

export const Vacio: Story = {
  parameters: { msw: { handlers: handlersModelos('vacio') } },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText('Sin modelos');
  },
};

export const ErrorDeCarga: Story = {
  parameters: { msw: { handlers: handlersModelos('error') } },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText(
      'No se pudieron cargar los modelos. Inténtalo de nuevo.',
    );
  },
};

export const Cargando: Story = {
  parameters: { msw: { handlers: handlersModelos('cargando') } },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText('Cargando modelos de IA');
  },
};
