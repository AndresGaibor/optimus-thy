import type { Meta, StoryObj } from '@storybook/react';
import { StatusBadge } from '../../index';

const meta = {
  title: 'Sistema de diseño/Moléculas/StatusBadge',
  component: StatusBadge,
  args: { kind: 'record', status: 'Completa' },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FichaCompleta: Story = { args: { kind: 'record', status: 'Completa' } };
export const FichaEnOCR: Story = { args: { kind: 'record', status: 'En OCR' } };
export const FichaEnRevisión: Story = { args: { kind: 'record', status: 'Revisión' } };
export const FichaPendiente: Story = { args: { kind: 'record', status: 'Pendiente' } };
export const InferenciaEnCola: Story = { args: { kind: 'inference', status: 'En cola' } };
export const InferenciaEnProceso: Story = { args: { kind: 'inference', status: 'En proceso' } };
export const InferenciaCompletada: Story = { args: { kind: 'inference', status: 'Completado' } };
export const InferenciaConError: Story = { args: { kind: 'inference', status: 'Error' } };
export const UsuarioActivo: Story = { args: { kind: 'user', status: 'Activo' } };
export const SolicitudPendiente: Story = { args: { kind: 'dataset-request', status: 'pendiente' } };
export const SolicitudAprobada: Story = { args: { kind: 'dataset-request', status: 'aprobado' } };
export const SolicitudRechazada: Story = { args: { kind: 'dataset-request', status: 'rechazado' } };
export const Playground: Story = {};
