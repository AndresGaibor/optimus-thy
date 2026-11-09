import type { Meta, StoryObj } from '@storybook/react';
import { ActivityTypeBadge } from '../../index';

const meta = {
  title: 'Sistema de diseño/Moléculas/ActivityTypeBadge',
  component: ActivityTypeBadge,
  args: { type: 'lectura' },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof ActivityTypeBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Lectura: Story = { args: { type: 'lectura' } };
export const Exportación: Story = { args: { type: 'exportacion' } };
export const Inferencia: Story = { args: { type: 'inferencia' } };
export const Carga: Story = { args: { type: 'carga' } };
export const Seguridad: Story = { args: { type: 'seguridad' } };
export const Administración: Story = { args: { type: 'administracion' } };
export const Auditoría: Story = { args: { type: 'auditoria' } };
export const Playground: StoryObj<typeof meta> = {};
