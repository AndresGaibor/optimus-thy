import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DecisionRegistrada } from '../api/decisiones';
import { ConclusionMedica } from '../pages/medico/ConclusionMedica';
import type { CategoriaConclusion } from '../pages/medico/conclusion/compartidos';

const INFERENCIA = {
  id: 'inferencia-1',
  caso_id: 'caso-1',
  resultado: 'maligno',
  confianza: 0.87,
  creado_en: '2026-06-10T14:30:00Z',
  modelo: { nombre: 'Swin', version: '1.0' },
};

const NOTA_VALIDA = 'Nódulo sólido de bordes regulares; correlacionar con ecografía de control.';
const OBSERVACIONES = 'Aceptada tras revisar la ecografía de control.';

const DECISION: DecisionRegistrada = {
  decision: 'acepta',
  observaciones: OBSERVACIONES,
  creado_en: '2026-06-11T09:15:00Z',
  autor: { id: 'usuario-7', rol: 'medico' },
};

const ERROR_SIN_DECISION = {
  error: {
    code: 'decision_no_encontrada',
    message: 'La inferencia no tiene una decisión registrada.',
  },
};

interface FetchMock {
  mock: { calls: Array<[Request]> };
  mockResolvedValueOnce: (valor: Response) => unknown;
}

let fetchMock: FetchMock;

function responder(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  fetchMock = vi.fn(() =>
    Promise.resolve(responder(ERROR_SIN_DECISION, 404)),
  ) as unknown as FetchMock;
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function montar() {
  const onAbiertaChange = vi.fn();
  const onRegistrada = vi.fn();
  render(
    <ConclusionMedica
      abierta
      onAbiertaChange={onAbiertaChange}
      inferencia={INFERENCIA}
      onRegistrada={onRegistrada}
    />,
  );
  return { onAbiertaChange, onRegistrada };
}

async function montarFormulario() {
  const controles = montar();
  await screen.findByRole('button', { name: 'Revisar conclusión' });
  return controles;
}

async function completarYRevisar(user: UserEvent, categoria: CategoriaConclusion = 'acepta') {
  await user.selectOptions(screen.getByLabelText(/^Categoría/), categoria);
  await user.type(screen.getByLabelText(/^Nota/), NOTA_VALIDA);
  await user.click(screen.getByRole('button', { name: 'Revisar conclusión' }));
}

describe('ConclusionMedica', () => {
  it('muestra la predicción como referencia, sin avisar que no se guarda', async () => {
    await montarFormulario();
    const dialogo = screen.getByRole('dialog');

    expect(within(dialogo).getByText('Maligno')).toBeInTheDocument();
    expect(within(dialogo).getByText('87.0 %')).toBeInTheDocument();
    expect(within(dialogo).getByText('La predicción no se modifica')).toBeInTheDocument();
    expect(within(dialogo).queryByText(/no se guardará|no se enviará/i)).not.toBeInTheDocument();
  });

  it('valida categoría y nota antes de confirmar', async () => {
    const user = userEvent.setup();
    await montarFormulario();

    await user.click(screen.getByRole('button', { name: 'Revisar conclusión' }));

    expect(screen.getByText('Selecciona una categoría para tu conclusión.')).toBeInTheDocument();
    expect(screen.getByText('Escribe una nota con tu criterio.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Revisa tu conclusión' })).not.toBeInTheDocument();
  });

  it('exige una nota con el mínimo de caracteres', async () => {
    const user = userEvent.setup();
    await montarFormulario();

    await user.selectOptions(screen.getByLabelText(/^Categoría/), 'corrige');
    await user.type(screen.getByLabelText(/^Nota/), 'Muy corta');
    await user.click(screen.getByRole('button', { name: 'Revisar conclusión' }));

    expect(screen.getByText('La nota debe tener al menos 10 caracteres.')).toBeInTheDocument();
  });

  it('envía la conclusión y cierra con aviso', async () => {
    fetchMock.mockResolvedValueOnce(responder(ERROR_SIN_DECISION, 404));
    fetchMock.mockResolvedValueOnce(responder(DECISION, 201));
    const user = userEvent.setup();
    const { onAbiertaChange, onRegistrada } = await montarFormulario();

    await completarYRevisar(user);
    await user.click(screen.getByRole('button', { name: 'Enviar conclusión' }));

    await waitFor(() => expect(onAbiertaChange).toHaveBeenCalledWith(false));
    expect(onRegistrada).toHaveBeenCalledWith(DECISION);

    const envio = fetchMock.mock.calls.find(([entrada]) => entrada.method === 'POST')?.[0];
    if (!envio) throw new Error('No se envió la decisión al servidor.');
    await expect(envio.json()).resolves.toEqual({
      decision: 'acepta',
      observaciones: NOTA_VALIDA,
    });
  });

  it('abre en modo lectura cuando el servidor responde 409', async () => {
    fetchMock.mockResolvedValueOnce(responder(ERROR_SIN_DECISION, 404));
    fetchMock.mockResolvedValueOnce(
      responder({ error: { code: 'decision_existente', message: 'Ya existe' } }, 409),
    );
    fetchMock.mockResolvedValueOnce(responder(DECISION));
    const user = userEvent.setup();
    const { onAbiertaChange } = await montarFormulario();

    await completarYRevisar(user);
    await user.click(screen.getByRole('button', { name: 'Enviar conclusión' }));

    expect(await screen.findByText('Conclusión ya registrada')).toBeInTheDocument();
    expect(screen.getByText('Acepto el resultado')).toBeInTheDocument();
    expect(screen.getByText(OBSERVACIONES)).toBeInTheDocument();
    expect(screen.getByText('usuario-7')).toBeInTheDocument();
    expect(screen.getByText('medico')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /enviar|reenviar/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/decision_existente|409/i)).not.toBeInTheDocument();
    expect(onAbiertaChange).not.toHaveBeenCalled();
  });

  it('abre en modo lectura si la inferencia ya tiene decisión', async () => {
    fetchMock.mockResolvedValueOnce(responder(DECISION));
    montar();

    expect(await screen.findByText('Conclusión ya registrada')).toBeInTheDocument();
    expect(screen.getByText(OBSERVACIONES)).toBeInTheDocument();
    expect(screen.getByText('medico')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Revisar conclusión' })).not.toBeInTheDocument();
  });

  it('muestra un error sin detalles y reintenta el envío', async () => {
    fetchMock.mockResolvedValueOnce(responder(ERROR_SIN_DECISION, 404));
    fetchMock.mockResolvedValueOnce(
      responder({ error: { code: 'internal_error', message: 'Traceback secreto' } }, 500),
    );
    fetchMock.mockResolvedValueOnce(responder(DECISION, 201));
    const user = userEvent.setup();
    const { onAbiertaChange } = await montarFormulario();

    await completarYRevisar(user);
    await user.click(screen.getByRole('button', { name: 'Enviar conclusión' }));

    expect(await screen.findByText('No se pudo registrar la conclusión')).toBeInTheDocument();
    expect(screen.queryByText(/Traceback secreto/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reintentar envío' }));
    await waitFor(() => expect(onAbiertaChange).toHaveBeenCalledWith(false));
  });

  it('reintenta la consulta inicial cuando falla', async () => {
    fetchMock.mockResolvedValueOnce(
      responder({ error: { code: 'internal_error', message: 'sin conexión' } }, 500),
    );
    fetchMock.mockResolvedValueOnce(responder(ERROR_SIN_DECISION, 404));
    const user = userEvent.setup();
    montar();

    expect(await screen.findByText('No se pudo consultar la conclusión')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('button', { name: 'Revisar conclusión' })).toBeInTheDocument();
  });

  it('vuelve al formulario conservando lo escrito', async () => {
    const user = userEvent.setup();
    await montarFormulario();

    await completarYRevisar(user, 'descarta');
    await user.click(screen.getByRole('button', { name: 'Volver' }));

    expect(screen.getByLabelText(/^Categoría/)).toHaveValue('descarta');
    expect(screen.getByLabelText(/^Nota/)).toHaveValue(NOTA_VALIDA);
    expect(screen.getByRole('heading', { name: 'Conclusión del médico' })).toBeInTheDocument();
  });

  it('notifica el cierre al contenedor', async () => {
    const user = userEvent.setup();
    const { onAbiertaChange } = await montarFormulario();

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onAbiertaChange).toHaveBeenCalledWith(false);
  });
});
