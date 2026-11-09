import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import type { ReactNode } from 'react';
import { Callout, FileDropzone, PageHeader } from '../index';

const onFilesPredeterminado = fn();
const onFilesInvalidos = fn();

function Pagina({ descripcion, children }: { descripcion: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-(--content-max-width) space-y-6 p-6">
      <PageHeader title="Carga de archivos" description={descripcion} />
      <Callout title="Limitación conocida">
        El componente descarta en silencio los tipos no admitidos; el contenedor debe mostrar el
        error mediante la prop error.
      </Callout>
      {children}
    </main>
  );
}

const meta = {
  title: 'Sistema de diseño/Patrones/Carga de archivos',
  parameters: { layout: 'fullscreen', a11y: { test: 'error' } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Predeterminado: Story = {
  render: () => (
    <Pagina descripcion="Selecciona un PDF sintético para la demostración.">
      <FileDropzone
        onFiles={onFilesPredeterminado}
        accept=".pdf"
        label="Seleccionar PDF"
        hint="Solo archivos PDF de demostración."
      />
    </Pagina>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    onFilesPredeterminado.mockClear();
    const input = canvas.getByLabelText(/Seleccionar PDF/);
    await userEvent.upload(
      input,
      new File(['sintético'], 'ficha-demo.pdf', { type: 'application/pdf' }),
    );
    await expect(onFilesPredeterminado).toHaveBeenCalledTimes(1);
    const [received] = onFilesPredeterminado.mock.calls[0] as [File[]];
    await expect(received).toHaveLength(1);
    await expect(received[0]?.name).toBe('ficha-demo.pdf');
  },
};

export const ConError: Story = {
  render: () => (
    <Pagina descripcion="Explica qué formato debe corregirse.">
      <FileDropzone
        onFiles={onFilesInvalidos}
        accept=".pdf"
        label="Seleccionar PDF"
        hint="El archivo debe ser un PDF."
        error="El tipo de archivo no coincide con el formato permitido."
      />
    </Pagina>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    onFilesInvalidos.mockClear();
    const input = canvas.getByLabelText(/Seleccionar PDF/);
    const uploader = userEvent.setup({ applyAccept: false });
    await uploader.upload(input, new File([''], 'x.exe', { type: 'application/octet-stream' }));
    await expect(onFilesInvalidos).not.toHaveBeenCalled();
    await expect(
      canvas.getByText('El tipo de archivo no coincide con el formato permitido.'),
    ).toBeVisible();
  },
};

export const Multiple: Story = {
  render: () => <CargaMultiple />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText(/Seleccionar archivos PDF/);
    await userEvent.upload(input, [
      new File(['sintético'], 'ficha-demo.pdf', { type: 'application/pdf' }),
    ]);
    await expect(canvas.getByRole('status')).toHaveTextContent('1 archivo recibido.');
  },
};

function CargaMultiple() {
  const [conteo, setConteo] = useState(0);
  const onFiles = fn((files: File[]) => setConteo(files.length));
  return (
    <Pagina descripcion="Permite seleccionar más de un PDF de demostración.">
      <FileDropzone onFiles={onFiles} accept=".pdf" multiple label="Seleccionar archivos PDF" />
      <p role="status">
        {conteo} {conteo === 1 ? 'archivo recibido.' : 'archivos recibidos.'}
      </p>
    </Pagina>
  );
}
