import type { Meta, StoryObj } from '@storybook/react-vite';
import { RoleCard } from './RoleCard';

const meta = {
  title: 'Sistema de diseño/Organismos/RoleCard',
  component: RoleCard,
  args: {
    role: 'medico',
    description: 'Revisa registros y utiliza resultados de IA como apoyo para la revisión clínica.',
    highlights: ['Registros sintéticos', 'Revisión con supervisión profesional'],
    actionLabel: 'Entrar como Médico',
  },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof RoleCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Medico: Story = {
  args: {
    role: 'medico',
    description: 'Revisa registros y utiliza resultados de IA como apoyo para la revisión clínica.',
    highlights: ['Registros sintéticos', 'Revisión con supervisión profesional'],
    actionLabel: 'Entrar como Médico',
  },
};
export const Investigador: Story = {
  args: {
    role: 'investigador',
    description: 'Explora métricas ilustrativas y datasets de demostración sintética.',
    highlights: ['Datos sintéticos', 'Métricas sin validez de rendimiento real'],
    actionLabel: 'Entrar como Investigador',
  },
};
export const Administrador: Story = {
  args: {
    role: 'administrador',
    description: 'Revisa controles de acceso y actividad del entorno de demostración.',
    highlights: ['Controles de acceso', 'Actividad sintética'],
    actionLabel: 'Entrar como Administrador',
  },
};
export const Playground: Story = {};
