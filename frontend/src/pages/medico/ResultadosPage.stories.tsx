import type { Meta, StoryObj } from '@storybook/react-vite';
import { within } from 'storybook/test';
import { crearHandlers } from '../../mocks/handlers';
import { ResultadosPage } from './ResultadosPage';

const meta = {
  title: 'Aplicación/Médico/Resultados (HU-081)',
  component: ResultadosPage,
  parameters: {
    router: { initialEntries: ['/medico/resultados'] },
  },
  tags: ['ai-generated'],
} satisfies Meta<typeof ResultadosPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ConResultados: Story = {
  parameters: { msw: { handlers: crearHandlers('ok') } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('CASO-0001');
    await within(canvas.getByRole('table')).findByText('Maligno');
  },
};

export const SinResultados: Story = {
  parameters: { msw: { handlers: crearHandlers('vacio') } },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText('Sin resultados');
  },
};

export const Cargando: Story = {
  parameters: { msw: { handlers: crearHandlers('cargando') } },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText('Cargando resultados');
  },
};

export const ConError: Story = {
  parameters: { msw: { handlers: crearHandlers('error') } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('No se pudieron cargar los resultados');
  },
};
