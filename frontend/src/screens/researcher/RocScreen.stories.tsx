import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { RocScreen } from './RocScreen';
import { investigadorExtraFixtures } from '../fixtures/investigador-extra';

const meta = {
  title: 'Aplicación/Investigador/Curva ROC',
  component: RocScreen,
  args: {
    scenarios: [investigadorExtraFixtures.buenDesempeno],
  },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof RocScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Curva y distribución del escenario de buen desempeño, con las dos tablas
 * equivalentes plegadas.
 */
export const BuenDesempeno: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByText('Curva ROC ilustrativa').length).toBeGreaterThan(0);
    const tablas = canvas.getAllByText('Ver tabla equivalente');
    await expect(tablas).toHaveLength(2);
    const primera = tablas[0];
    if (!primera) throw new Error('Falta el resumen de la tabla equivalente');
    await userEvent.click(primera);
    await expect(canvas.getAllByRole('table').length).toBeGreaterThan(0);
  },
};

/**
 * Escenario con peor discriminación: la curva se acerca a la diagonal y el AUC
 * baja, sin cambiar la estructura de la pantalla.
 */
export const BajoDesempeno: Story = {
  args: {
    scenarios: [investigadorExtraFixtures.bajoDesempeno],
  },
};
