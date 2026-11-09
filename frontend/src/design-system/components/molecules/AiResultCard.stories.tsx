import type { Meta, StoryObj } from '@storybook/react';
import { AiResultCard } from '../../index';

const meta = {
  title: 'Sistema de diseño/Moléculas/AiResultCard',
  component: AiResultCard,
  args: {
    classification: 'normal',
    probability: 0.94,
    modelVersion: 'modelo-demo-1.2',
    date: '30 oct 2026',
    dateTime: '2026-10-30',
  },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof AiResultCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = { args: { classification: 'normal', probability: 0.94 } };
export const Benigno: Story = { args: { classification: 'benigno', probability: 0.82 } };
export const Maligno: Story = { args: { classification: 'maligno', probability: 0.71 } };
export const Playground: StoryObj<typeof meta> = {};
