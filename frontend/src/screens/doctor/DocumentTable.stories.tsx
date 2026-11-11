import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Button } from '../../design-system';
import type { DocumentoCasoDemo, OcrEstado } from '../fixtures/documentos-extra';
import { documentosCasoDemo } from '../fixtures/documentos-extra';
import { DocumentTable } from './DocumentTable';

function documentoConEstado(
  estado: DocumentoCasoDemo['estadoOcr'],
  motivo?: string,
): DocumentoCasoDemo {
  const documentoBase = documentosCasoDemo[0];
  if (!documentoBase) throw new Error('Falta el documento sintético base para las historias OCR');

  return {
    ...documentoBase,
    id: `DEMO-DOC-${estado.replace(/\s+/g, '-').toUpperCase()}`,
    nombre: `documento-${estado.toLowerCase().replace(/\s+/g, '-')}.pdf`,
    estadoOcr: estado,
    ...(motivo === undefined ? {} : { motivoError: motivo }),
  };
}

const meta = {
  title: 'Aplicación/Médico/Documentos/Estado OCR',
  component: DocumentTable,
  args: { onView: () => undefined, onDownload: () => undefined },
  tags: ['ai-generated'],
} satisfies Meta<typeof DocumentTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EnCola: Story = { args: { documents: [documentoConEstado('En cola')] } };
export const Procesando: Story = { args: { documents: [documentoConEstado('Procesando')] } };
export const Listo: Story = { args: { documents: [documentoConEstado('Listo')] } };
export const ErrorConMotivo: Story = {
  args: {
    documents: [
      documentoConEstado(
        'Error',
        'No se pudo leer el texto: contraste insuficiente en la página 1.',
      ),
    ],
  },
};

function EstadoOcrActualizable({
  documents,
  onView,
  onDownload,
}: {
  documents: DocumentoCasoDemo[];
  onView: (documento: DocumentoCasoDemo) => void;
  onDownload: (documento: DocumentoCasoDemo) => void;
}) {
  const [documentosActualizados, setDocumentosActualizados] = useState(documents);

  return (
    <>
      <Button
        onClick={() =>
          setDocumentosActualizados((actuales) =>
            actuales.map((documento) => ({ ...documento, estadoOcr: 'Procesando' as OcrEstado })),
          )
        }
      >
        Actualizar estado OCR
      </Button>
      <DocumentTable documents={documentosActualizados} onView={onView} onDownload={onDownload} />
    </>
  );
}

export const ActualizacionDeEstado: Story = {
  args: { documents: [documentoConEstado('En cola')] },
  render: (args) => <EstadoOcrActualizable {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('En cola')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Actualizar estado OCR' }));
    await expect(canvas.getByText('Procesando')).toBeVisible();
    await expect(canvas.queryByText('En cola')).not.toBeInTheDocument();
  },
};
