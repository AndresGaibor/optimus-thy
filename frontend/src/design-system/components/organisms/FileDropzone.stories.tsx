import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { FileDropzone } from './FileDropzone';

// Storybook no debe registrar nombres, metadatos ni contenido de archivos elegidos.
const onFilesAction = fn();
const discardFilePayload = () => onFilesAction();
const meta = {
  title: 'Sistema de diseño/Organismos/FileDropzone',
  component: FileDropzone,
  args: {
    label: 'Selecciona un archivo de demostración',
    hint: 'PDF · archivo sintético; el componente no lo transmite ni procesa.',
    accept: '.pdf,application/pdf',
    onFiles: discardFilePayload,
  },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof FileDropzone>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Predeterminada: Story = {};
export const SeleccionMultiple: Story = { args: { multiple: true, accept: '.pdf,.csv' } };
export const ConError: Story = {
  args: { error: 'El tipo de archivo no coincide con el formato permitido.' },
};
export const Deshabilitada: Story = { args: { disabled: true } };
export const Playground: Story = {};
