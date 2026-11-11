import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { documentosCasoDemo } from '../fixtures/documentos-extra';
import { DocumentDownloadDialog } from './DocumentDownloadDialog';

const documento = documentosCasoDemo[0];
if (!documento) throw new Error('Falta el documento sintético base para las historias de descarga');

const enlaceDemo =
  'https://demo.optimus-thy.local/documentos/firmada?doc=DEMO-DOC-001&exp=2026-03-18T10:40:00Z';

const meta = {
  title: 'Aplicación/Médico/Documentos/Acceso al documento',
  component: DocumentDownloadDialog,
  args: {
    document: documento,
    descarga: { estado: 'listo', enlace: enlaceDemo, caducaEn: '2026-03-18T10:40:00Z' },
    onOpenChange: () => undefined,
    onConfirm: () => undefined,
  },
  tags: ['ai-generated'],
} satisfies Meta<typeof DocumentDownloadDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EnlaceListo: Story = {
  play: async ({ canvasElement }) => {
    const dialogo = within(canvasElement.ownerDocument.body);
    await expect(dialogo.getByText(enlaceDemo)).toBeVisible();
    await expect(dialogo.getByText(/Caduca el/)).toBeVisible();
    await expect(dialogo.getByRole('button', { name: 'Abrir enlace firmado' })).toBeEnabled();
  },
};

export const ObteniendoEnlace: Story = {
  args: { descarga: { estado: 'cargando' } },
  play: async ({ canvasElement }) => {
    const dialogo = within(canvasElement.ownerDocument.body);
    await expect(dialogo.getByText('Obteniendo el enlace firmado…')).toBeVisible();
    await expect(dialogo.getByRole('button', { name: 'Abrir enlace firmado' })).toBeDisabled();
  },
};

export const ErrorAlObtenerEnlace: Story = {
  args: {
    descarga: {
      estado: 'error',
      mensaje: 'No se pudo obtener el enlace firmado. Vuelve a intentarlo en unos segundos.',
    },
  },
  play: async ({ canvasElement }) => {
    const dialogo = within(canvasElement.ownerDocument.body);
    await expect(dialogo.getByText('No se pudo obtener el enlace')).toBeVisible();
    await expect(dialogo.queryByText('Enlace firmado:')).not.toBeInTheDocument();
    await expect(dialogo.getByRole('button', { name: 'Abrir enlace firmado' })).toBeDisabled();
  },
};
