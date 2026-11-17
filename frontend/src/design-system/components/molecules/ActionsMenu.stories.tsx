import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ActionsMenu } from './ActionsMenu';

const meta = {
  title: 'Sistema de diseño/Moléculas/ActionsMenu',
  component: ActionsMenu,
  tags: ['ai-generated'],
} satisfies Meta<typeof ActionsMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const acciones = [
  { label: 'Gestionar roles', onSelect: () => {} },
  { label: 'Desactivar', tone: 'danger' as const, onSelect: () => {} },
];

export const Cerrado: Story = {
  args: { label: 'Acciones de ana@ejemplo.test', items: acciones },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const disparador = canvas.getByRole('button', { name: 'Acciones de ana@ejemplo.test' });
    await expect(disparador).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByRole('menu')).not.toBeInTheDocument();
  },
};

export const AbiertoConTeclado: Story = {
  args: { label: 'Acciones de ana@ejemplo.test', items: acciones },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const usuario = userEvent.setup();
    const disparador = canvas.getByRole('button', { name: 'Acciones de ana@ejemplo.test' });
    disparador.focus();
    await usuario.keyboard('{Enter}');
    const panel = await within(document.body).findByRole('menu');
    await expect(within(panel).getByRole('menuitem', { name: 'Gestionar roles' })).toHaveFocus();
    await usuario.keyboard('{Escape}');
    await expect(panel).not.toBeInTheDocument();
    await expect(disparador).toHaveFocus();
  },
};

export const ConAccionDeshabilitada: Story = {
  args: {
    label: 'Acciones de admin@ejemplo.test',
    items: [
      { label: 'Gestionar roles', onSelect: () => {} },
      {
        label: 'Desactivar',
        tone: 'danger',
        disabled: true,
        title: 'No puedes desactivar tu propia cuenta',
        onSelect: () => {},
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const usuario = userEvent.setup();
    await usuario.click(canvas.getByRole('button', { name: 'Acciones de admin@ejemplo.test' }));
    const panel = await within(document.body).findByRole('menu');
    await expect(within(panel).getByRole('menuitem', { name: 'Desactivar' })).toBeDisabled();
  },
};
