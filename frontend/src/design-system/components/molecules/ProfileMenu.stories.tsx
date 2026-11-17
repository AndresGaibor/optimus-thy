import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ProfileMenu } from './ProfileMenu';

const opciones = [
  { value: 'medico' as const, label: 'Médico' },
  { value: 'investigador' as const, label: 'Investigador' },
  { value: 'administrador' as const, label: 'Administrador' },
];

const meta = {
  title: 'Sistema de diseño/Moléculas/ProfileMenu',
  component: ProfileMenu,
  args: {
    nombre: 'Andres Gaibor',
    rolActivo: 'administrador',
    opciones,
    onCambiarRol: fn(),
    onCerrarSesion: fn(),
  },
  parameters: { layout: 'centered', a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof ProfileMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ConVariasAreas: Story = {
  name: 'Varias áreas',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const disparador = canvas.getByRole('button', { name: /andres gaibor/i });
    await expect(disparador).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(disparador);
    await expect(disparador).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByText('Cambiar área de trabajo')).toBeVisible();

    const activa = canvas.getByRole('button', { name: /^administrador$/i });
    await expect(activa).toHaveAttribute('aria-pressed', 'true');
    const otra = canvas.getByRole('button', { name: /^médico$/i });
    await expect(otra).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(otra);
    await expect(args.onCambiarRol).toHaveBeenCalledWith('medico');
    await expect(canvas.queryByText('Cambiar área de trabajo')).not.toBeInTheDocument();
  },
};

export const CierreConEscape: Story = {
  name: 'Escape devuelve el foco',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const disparador = canvas.getByRole('button', { name: /andres gaibor/i });

    await userEvent.click(disparador);
    await expect(canvas.getByText('Cambiar área de trabajo')).toBeVisible();

    await userEvent.keyboard('{Escape}');
    await expect(canvas.queryByText('Cambiar área de trabajo')).not.toBeInTheDocument();
    await expect(disparador).toHaveFocus();
    await expect(disparador).toHaveAttribute('aria-expanded', 'false');
  },
};

export const NavegacionConTab: Story = {
  name: 'Tab y Escape',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const disparador = canvas.getByRole('button', { name: /andres gaibor/i });
    await userEvent.click(disparador);
    await expect(disparador).toHaveFocus();
    await expect(canvas.getByRole('group', { name: 'Cambiar área de trabajo' })).toBeVisible();

    const grupo = canvas.getByRole('group', { name: 'Cambiar área de trabajo' });
    const medico = within(grupo).getByRole('button', { name: /^médico$/i });
    const investigador = within(grupo).getByRole('button', { name: /^investigador$/i });

    await userEvent.tab();
    await expect(medico).toHaveFocus();
    await userEvent.tab();
    await expect(investigador).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(medico).toHaveFocus();

    await userEvent.keyboard('{Escape}');
    await expect(disparador).toHaveFocus();
    await expect(canvas.queryByText('Cambiar área de trabajo')).not.toBeInTheDocument();
  },
};

export const UnaSolaArea: Story = {
  name: 'Una sola área',
  args: {
    rolActivo: 'medico',
    opciones: [{ value: 'medico', label: 'Médico' }],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /andres gaibor/i }));

    const unica = canvas.getByRole('button', { name: /^médico$/i });
    await expect(unica).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
  },
};
