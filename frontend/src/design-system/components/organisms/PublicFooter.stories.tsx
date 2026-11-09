import type { Meta, StoryObj } from '@storybook/react-vite';
import { PublicFooter } from './PublicFooter';

const meta = {
  title: 'Sistema de diseño/Organismos/PublicFooter',
  component: PublicFooter,
  args: {
    description: 'Herramienta de apoyo a la gestión clínica relacionada con cáncer de tiroides.',
    links: [],
    note: 'OPTIMUS-THY — ESPOCH · Proyecto de Tesis 2024-2026',
  },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof PublicFooter>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Predeterminada: Story = {};

export const SoloIdentidad: Story = {
  render: () => <PublicFooter description="" links={[]} note="" />,
};
