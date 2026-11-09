import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from './Textarea';

const meta = {
  title: 'Sistema de diseño/Átomos/Textarea',
  component: Textarea,
  args: { 'aria-label': 'Notas de demostración', placeholder: 'Escribe un comentario' },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof Textarea>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Predeterminado: Story = {};
export const Estados: Story = {
  render: () => (
    <div className="grid max-w-md gap-4">
      <Textarea aria-label="Comentario" placeholder="Escribe un comentario" />
      <Textarea
        aria-label="Comentario con error"
        aria-invalid="true"
        defaultValue="Revisa este texto"
      />
      <Textarea aria-label="Comentario deshabilitado" disabled placeholder="Deshabilitado" />
    </div>
  ),
};
export const Playground: Story = {};
