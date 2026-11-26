import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DialogoSubida } from '../pages/medico/inferencia/DialogoSubida';
import { useSubidaEcografia } from '../pages/medico/inferencia/useSubidaEcografia';

function SubidaPrueba() {
  const subida = useSubidaEcografia({ casoId: 'caso-demo', alSubir: () => {} });
  return (
    <>
      <button onClick={subida.abrir}>Abrir carga</button>
      <DialogoSubida
        abierto={subida.abierta}
        archivos={subida.archivos}
        guardando={subida.guardando}
        onCambiarApertura={subida.cambiarApertura}
        onArchivo={subida.elegir}
        onSubir={() => void subida.subir()}
      />
    </>
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('subida de imágenes duplicadas', () => {
  it('avisa que la imagen ya está cargada en el caso', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { code: 'imagen_duplicada', message: 'Esta imagen ya está cargada en el caso.' },
          }),
          { status: 409, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );
    render(<SubidaPrueba />);

    await user.click(screen.getByRole('button', { name: 'Abrir carga' }));
    await user.upload(
      await screen.findByLabelText(/una o varias ecografías PNG o JPEG/),
      new File(['imagen sintética'], 'duplicada.png', { type: 'image/png' }),
    );
    await user.click(screen.getByRole('button', { name: 'Subir ecografía' }));

    expect(await screen.findByText('Esta imagen ya está cargada en el caso.')).toBeInTheDocument();
  });
});
