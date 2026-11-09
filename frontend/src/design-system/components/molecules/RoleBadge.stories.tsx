import type { Meta, StoryObj } from '@storybook/react';
import { RoleBadge } from '../../index';

const meta = {
  title: 'Sistema de diseño/Moléculas/RoleBadge',
  component: RoleBadge,
  args: { role: 'medico' },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof RoleBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Médico: Story = { args: { role: 'medico' } };
export const Investigador: Story = { args: { role: 'investigador' } };
export const Administrador: Story = { args: { role: 'administrador' } };
export const Playground: Story = {};
