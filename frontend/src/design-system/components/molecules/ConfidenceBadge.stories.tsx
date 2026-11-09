import type { Meta, StoryObj } from '@storybook/react';
import { ConfidenceBadge } from '../../index';

const meta = {
  title: 'Sistema de diseño/Moléculas/ConfidenceBadge',
  component: ConfidenceBadge,
  args: {
    value: 82.4,
    label: 'Confianza de demostración',
    tone: 'info',
  },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof ConfidenceBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DatoSintético: Story = {
  args: { value: 61.2, label: 'Valor sintético', tone: 'warning' },
};
export const TonoInformativo: Story = {
  args: { value: 82.4, label: 'Confianza de demostración', tone: 'info' },
};
export const TonoCorrecto: Story = {
  args: { value: 95, label: 'Valor sintético', tone: 'success' },
};
export const TonoNeutral: Story = {
  args: { value: 95, label: 'Valor sintético', tone: 'neutral' },
};
export const Playground: Story = {};
