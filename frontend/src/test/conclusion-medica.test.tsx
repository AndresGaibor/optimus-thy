import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConclusionMedica } from '../pages/medico/ConclusionMedica';

const INFERENCIA = {
  resultado: 'maligno',
  confianza: 0.87,
  creado_en: '2026-06-10T14:30:00Z',
  modelo: { nombre: 'Swin', version: '1.0' },
};

const NOTA_VALIDA = 'Nódulo sólido de bordes regulares; correlacionar con ecografía de control.';

function montar() {
  const onAbiertaChange = vi.fn();
  render(
    <ConclusionMedica abierta onAbiertaChange={onAbiertaChange} inferencia={INFERENCIA} />,
  );
  return { onAbiertaChange };
}

describe('ConclusionMedica', () => {
  it('muestra la predicción como referencia y avisa que aún no se guarda', () => {
    montar();
    const dialogo = screen.getByRole('dialog');

    expect(within(dialogo).getByText('Maligno')).toBeInTheDocument();
    expect(within(dialogo).getByText('87.0 %')).toBeInTheDocument();
    expect(within(dialogo).getByText(/no se enviará ni se guardará al cerrar/)).toBeInTheDocument();
    expect(within(dialogo).queryByRole('button', { name: /guardar/i })).not.toBeInTheDocument();
  });

  it('valida categoría y nota antes de confirmar', async () => {
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByRole('button', { name: 'Revisar conclusión' }));

    expect(screen.getByText('Selecciona una categoría para tu conclusión.')).toBeInTheDocument();
    expect(screen.getByText('Escribe una nota con tu criterio.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Revisa tu conclusión' })).not.toBeInTheDocument();
  });

  it('exige una nota con el mínimo de caracteres', async () => {
    const user = userEvent.setup();
    montar();

    await user.selectOptions(screen.getByLabelText(/^Categoría/), 'corrige');
    await user.type(screen.getByLabelText(/^Nota/), 'Muy corta');
    await user.click(screen.getByRole('button', { name: 'Revisar conclusión' }));

    expect(screen.getByText('La nota debe tener al menos 10 caracteres.')).toBeInTheDocument();
  });

  it('confirma la conclusión sin ofrecer un guardado que el servidor no soporta', async () => {
    const user = userEvent.setup();
    montar();

    await user.selectOptions(screen.getByLabelText(/^Categoría/), 'acepta');
    await user.type(screen.getByLabelText(/^Nota/), NOTA_VALIDA);
    await user.click(screen.getByRole('button', { name: 'Revisar conclusión' }));

    const dialogo = screen.getByRole('dialog');
    expect(within(dialogo).getByRole('heading', { name: 'Revisa tu conclusión' })).toBeInTheDocument();
    expect(within(dialogo).getByText('Acepto el resultado')).toBeInTheDocument();
    expect(within(dialogo).getByText(NOTA_VALIDA)).toBeInTheDocument();
    expect(within(dialogo).getByText('No se guardó nada')).toBeInTheDocument();
    expect(within(dialogo).getByText('Tu usuario de la sesión.')).toBeInTheDocument();
    expect(within(dialogo).queryByRole('button', { name: /registrar/i })).not.toBeInTheDocument();
  });

  it('vuelve al formulario conservando lo escrito', async () => {
    const user = userEvent.setup();
    montar();

    await user.selectOptions(screen.getByLabelText(/^Categoría/), 'descarta');
    await user.type(screen.getByLabelText(/^Nota/), NOTA_VALIDA);
    await user.click(screen.getByRole('button', { name: 'Revisar conclusión' }));
    await user.click(screen.getByRole('button', { name: 'Volver' }));

    expect(screen.getByLabelText(/^Categoría/)).toHaveValue('descarta');
    expect(screen.getByLabelText(/^Nota/)).toHaveValue(NOTA_VALIDA);
    expect(screen.getByRole('heading', { name: 'Conclusión del médico' })).toBeInTheDocument();
  });

  it('notifica el cierre al contenedor', async () => {
    const user = userEvent.setup();
    const { onAbiertaChange } = montar();

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onAbiertaChange).toHaveBeenCalledWith(false);
  });
});
