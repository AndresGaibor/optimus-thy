import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pagination } from './Pagination';

const meta = {
  title: 'Sistema de diseño/Moléculas/Pagination',
  component: Pagination,
  args: { total: 120, limit: 25, offset: 25, itemLabel: 'usuario', onOffsetChange: () => {} },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof Pagination>;

export default meta;

export const Intermedia: StoryObj<typeof meta> = {};
export const PrimeraPágina: StoryObj<typeof meta> = { args: { offset: 0 } };
export const ÚltimaPágina: StoryObj<typeof meta> = { args: { offset: 100 } };
export const SinResultados: StoryObj<typeof meta> = { args: { total: 0, offset: 0 } };
