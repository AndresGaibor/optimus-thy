import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AiResultCard, ImageViewer, OcrField, PatientCard, SupportNotice } from '../design-system';

describe('Patrones clínicos', () => {
  it('muestra el seudónimo y aclara que la tarjeta no presenta datos identificatorios', () => {
    render(
      <PatientCard
        pseudonym="Paciente demo 014"
        ageRange="45–54 años"
        institution="Centro de Salud de Demostración"
        caseStatus="Revisión"
      />,
    );

    expect(screen.getByText('Paciente demo 014')).toBeInTheDocument();
    expect(screen.getByText('45–54 años')).toBeInTheDocument();
    expect(screen.getByText('Centro de Salud de Demostración')).toBeInTheDocument();
    expect(screen.getByText('No se muestran datos identificatorios.')).toBeInTheDocument();
    expect(screen.getByText('Revisión')).toBeInTheDocument();
  });

  it('comunica cada clase de resultado mediante una etiqueta textual', () => {
    render(
      <>
        <AiResultCard
          classification="normal"
          probability={0.92}
          modelVersion="modelo-demo-1.2"
          date="2026-10-30"
        />
        <AiResultCard
          classification="benigno"
          probability={0.81}
          modelVersion="modelo-demo-1.2"
          date="2026-10-30"
        />
        <AiResultCard
          classification="maligno"
          probability={0.73}
          modelVersion="modelo-demo-1.2"
          date="2026-10-30"
        />
      </>,
    );

    expect(screen.getByText('Normal')).toBeInTheDocument();
    expect(screen.getByText('Benigno')).toBeInTheDocument();
    expect(screen.getByText('Maligno')).toBeInTheDocument();
    expect(screen.getByText(/^92/)).toBeInTheDocument();
    expect(screen.getAllByText('modelo-demo-1.2')).toHaveLength(3);
    expect(screen.getAllByText('2026-10-30')).toHaveLength(3);
    expect(screen.getAllByRole('progressbar')).toHaveLength(3);
  });

  it('presenta el apoyo de IA como nota y no como diagnóstico', () => {
    render(<SupportNotice context="inferencia" />);

    expect(screen.getByRole('note')).toHaveTextContent('no constituye un diagnóstico');
  });

  it('muestra la confianza OCR en texto además de la barra', () => {
    render(
      <OcrField label="Localización" value="Lóbulo izquierdo" confidence={0.86} source="ocr" />,
    );

    expect(screen.getByText(/Confianza: 86/)).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', {
        name: 'Confianza del campo Localización',
      }),
    ).toHaveAttribute('aria-valuenow', '86');
    expect(screen.getByText('Pendiente de confirmación')).toBeInTheDocument();
    expect(screen.getByText('Origen: OCR')).toBeInTheDocument();
  });

  it('ofrece controles de zoom con nombres accesibles y actualiza la ampliación', async () => {
    const user = userEvent.setup();
    render(
      <ImageViewer
        src="/imagen-sintetica.svg"
        alt="Imagen sintética de demostración"
        caption="Imagen sintética para revisión"
        analyzedRegion="Región central ilustrativa"
      />,
    );

    expect(
      screen.getByRole('img', { name: 'Imagen sintética de demostración' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Imagen sintética para revisión')).toBeInTheDocument();
    const zoomIn = screen.getByRole('button', { name: 'Acercar imagen' });
    const zoomOut = screen.getByRole('button', { name: 'Alejar imagen' });
    const resetZoom = screen.getByRole('button', { name: 'Restablecer zoom' });
    expect(zoomIn).toBeEnabled();
    expect(zoomOut).toBeEnabled();
    expect(resetZoom).toBeDisabled();
    await user.click(zoomIn);
    expect(screen.getByText('Ampliación: 125 %')).toBeInTheDocument();
    expect(resetZoom).toBeEnabled();
    await user.click(resetZoom);
    expect(screen.getByText('Ampliación: 100 %')).toBeInTheDocument();
    expect(screen.getByText('Región analizada: Región central ilustrativa')).toBeInTheDocument();
  });

  it('informa cuando el visor no tiene imagen', () => {
    render(<ImageViewer />);

    expect(screen.getByText('No hay una imagen disponible.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Acercar imagen' })).not.toBeInTheDocument();
  });
});
