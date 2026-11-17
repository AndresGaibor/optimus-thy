import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { crearHandlers } from '../../mocks/handlers';
import { SessionProvider } from '../../session/SessionContext';
import { InstitucionesPage } from './InstitucionesPage';

const meta = {
  title: 'Aplicación/Administrador/Instituciones',
  component: InstitucionesPage,
  parameters: {
    router: { initialEntries: ['/administrador/instituciones'] },
  },
  decorators: [
    (Story) => (
      <SessionProvider>
        <Story />
      </SessionProvider>
    ),
  ],
  tags: ['ai-generated'],
} satisfies Meta<typeof InstitucionesPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ConInstituciones: Story = {
  parameters: { msw: { handlers: crearHandlers('ok') } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('Hospital Demo');
    await expect(canvas.getByRole('button', { name: 'Nueva institución' })).toBeInTheDocument();
    await expect(
      canvas.getByRole('button', { name: /editar institución hosp-demo/i }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: /desactivar institución hosp-demo/i }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: /activar institución lab-sur/i }),
    ).toBeVisible();
    await expect(canvas.queryByRole('button', { name: /acciones de/i })).toBeNull();
    await expect(canvas.getByText('Mostrando 3 de 3 instituciones')).toBeVisible();
  },
};
