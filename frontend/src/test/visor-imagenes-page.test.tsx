import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { ImagenCaso } from '../api/imagenes';
import { AbrirVisor } from '../pages/medico/visor/AbrirVisor';

function crearImagen(id: string, cambios: Partial<ImagenCaso> = {}): ImagenCaso {
  return {
    id,
    caso_id: 'caso-demo',
    sha256: 'a'.repeat(64),
    formato: 'png',
    ancho: 314,
    alto: 402,
    tamano_bytes: 2048,
    sin_metadatos_exif_dicom: true,
    creado_en: '2026-05-10T09:00:00Z',
    url: `https://storage.local/${id}.png`,
    url_expira_en: 600,
    ...cambios,
  };
}

const IMAGENES = [
  crearImagen('img-1'),
  crearImagen('img-2', { formato: 'jpeg', ancho: 640, alto: 480 }),
];

async function abrirVisor() {
  const user = userEvent.setup();
  render(<AbrirVisor imagenes={IMAGENES} />);
  await user.click(screen.getByRole('button', { name: 'Abrir visor' }));
  const dialogo = await screen.findByRole('dialog', { name: 'Imagen 1 de 2' });
  return { user, dialogo };
}

describe('visor de imágenes del caso', () => {
  it('abre la primera imagen y permite acercar y ajustar a ventana', async () => {
    const { user, dialogo } = await abrirVisor();

    expect(within(dialogo).getByText('Ampliación: 100 %')).toBeInTheDocument();

    await user.click(within(dialogo).getByRole('button', { name: 'Acercar imagen' }));
    expect(within(dialogo).getByText('Ampliación: 125 %')).toBeInTheDocument();

    await user.click(within(dialogo).getByRole('button', { name: 'Ajustar a ventana' }));
    expect(within(dialogo).getByText('Ampliación: 100 %')).toBeInTheDocument();
  });

  it('navega a la imagen siguiente y vuelve a la anterior', async () => {
    const { user, dialogo } = await abrirVisor();

    expect(within(dialogo).getByRole('button', { name: 'Anterior' })).toBeDisabled();
    await user.click(within(dialogo).getByRole('button', { name: 'Siguiente' }));

    const segundo = await screen.findByRole('dialog', { name: 'Imagen 2 de 2' });
    expect(within(segundo).getByRole('button', { name: 'Siguiente' })).toBeDisabled();
    expect(within(segundo).getByText('640 × 480 px')).toBeInTheDocument();

    await user.click(within(segundo).getByRole('button', { name: 'Anterior' }));
    const primero = await screen.findByRole('dialog', { name: 'Imagen 1 de 2' });
    expect(within(primero).getByText('314 × 402 px')).toBeInTheDocument();
  });

  it('muestra los metadatos y el enlace de descarga de la imagen visible', async () => {
    const { dialogo } = await abrirVisor();

    expect(within(dialogo).getByText('Formato')).toBeInTheDocument();
    expect(within(dialogo).getByText('PNG')).toBeInTheDocument();
    expect(within(dialogo).getByText('Dimensiones')).toBeInTheDocument();
    expect(within(dialogo).getByText('314 × 402 px')).toBeInTheDocument();
    expect(within(dialogo).getByText('Tamaño')).toBeInTheDocument();
    expect(within(dialogo).getByText('2 kB')).toBeInTheDocument();
    expect(within(dialogo).getByText('aaaaaaaaaaaa…')).toBeInTheDocument();

    const descarga = within(dialogo).getByRole('link', { name: 'Descargar imagen' });
    expect(descarga).toHaveAttribute('href', 'https://storage.local/img-1.png');
    expect(descarga).toHaveAttribute('download', 'ecografia-img-1.png');
  });

  it('aplica brillo y contraste solo a la vista y conserva el archivo original', async () => {
    const { dialogo } = await abrirVisor();
    const vista = within(dialogo).getByRole('img', { name: /^Ecografía PNG/ });

    expect(vista.style.filter).toBe('brightness(1) contrast(1)');

    fireEvent.change(within(dialogo).getByLabelText(/Brillo/), { target: { value: '120' } });
    fireEvent.change(within(dialogo).getByLabelText(/Contraste/), { target: { value: '90' } });

    expect(vista.style.filter).toBe('brightness(1.2) contrast(0.9)');
    expect(vista).toHaveAttribute('src', 'https://storage.local/img-1.png');
  });

  it('muestra el error de carga y permite reintentar', async () => {
    const { user, dialogo } = await abrirVisor();

    fireEvent.error(screen.getByTestId('visor-carga'));

    const alerta = await within(dialogo).findByRole('alert');
    expect(alerta).toHaveTextContent('No se pudo cargar la imagen');
    expect(
      within(dialogo).queryByRole('button', { name: 'Acercar imagen' }),
    ).not.toBeInTheDocument();

    await user.click(within(dialogo).getByRole('button', { name: 'Reintentar' }));

    expect(within(dialogo).queryByRole('alert')).not.toBeInTheDocument();
    expect(within(dialogo).getByRole('button', { name: 'Acercar imagen' })).toBeInTheDocument();
  });
});
