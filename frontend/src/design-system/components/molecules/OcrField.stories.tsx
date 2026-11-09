import type { Meta, StoryObj } from '@storybook/react';
import { OcrField } from '../../index';

const meta = {
  title: 'Sistema de diseño/Moléculas/OcrField',
  component: OcrField,
  args: {
    label: 'Localización',
    value: 'Lóbulo izquierdo',
    confidence: 0.94,
    source: 'ocr',
  },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof OcrField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ConfianzaAlta: Story = { args: { confidence: 0.96 } };
export const ConfianzaBaja: Story = { args: { confidence: 0.38 } };
export const ValorCorregido: Story = {
  args: {
    label: 'Descripción del hallazgo',
    value: 'Nódulo de demostración en región central',
    confidence: 0.61,
    source: 'digitado',
  },
};
export const Estados: Story = {
  render: () => (
    <div className="grid max-w-xl gap-4">
      <OcrField label="Campo normal" value="Dato sintético" confidence={0.91} source="ocr" />
      <OcrField
        label="Campo con foco"
        value="Dato sintético enfocado"
        confidence={0.87}
        source="ocr"
        autoFocus
      />
      <OcrField
        label="Campo deshabilitado"
        value="Dato sintético bloqueado"
        confidence={0.87}
        source="ocr"
        disabled
      />
      <OcrField
        label="Campo con error"
        value="Dato pendiente de revisión"
        confidence={0.54}
        source="ocr"
        error="No se pudo confirmar el formato de este dato sintético."
      />
      <OcrField
        label="Campo en carga"
        value="Lectura sintética en curso"
        confidence={0.72}
        source="ocr"
        loading
      />
    </div>
  ),
};
export const Playground: Story = {};
