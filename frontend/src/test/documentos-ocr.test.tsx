import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { listarEstadosOcr } from '../api/documentos';
import { DocumentsScreen } from '../screens/doctor/DocumentsScreen';
import { casoDocumentosDemo, documentosCasoDemo } from '../screens/fixtures/documentos-extra';

function responder(cuerpo: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(cuerpo), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('listarEstadosOcr', () => {
  it('consulta la lista del caso y conserva el motivo de error del backend', async () => {
    const documentos = [
      {
        id: 'doc-1',
        estado_ocr: 'error',
        ocr_motivo: 'No se pudo leer el texto del documento.',
      },
    ];
    const fetchMock = responder({ documentos });

    await expect(listarEstadosOcr('caso-1')).resolves.toEqual(documentos);
    const request = fetchMock.mock.calls[0]?.[0];
    if (!(request instanceof Request)) {
      throw new Error('La consulta de documentos no se realizó mediante Request');
    }
    expect(request.url).toContain('/casos/caso-1/documentos');
  });
});

describe('DocumentsScreen', () => {
  it('actualiza el estado del documento y deja de consultar cuando el OCR termina', async () => {
    vi.useFakeTimers();
    const documento = documentosCasoDemo.find((item) => item.estadoOcr === 'En cola');
    if (!documento) throw new Error('Falta un documento sintético en cola');
    const fetchMock = responder({
      documentos: [{ id: documento.id, estado_ocr: 'listo', ocr_motivo: null }],
    });

    render(
      <DocumentsScreen
        documents={[documento]}
        casoId={casoDocumentosDemo.casoId}
        pacienteNombre={casoDocumentosDemo.pacienteNombre}
        onDownload={() => undefined}
        onUpload={() => undefined}
      />,
    );

    expect(screen.getByText('En cola')).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(screen.getByText('Listo')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('DocumentsScreen cleanup', () => {
  it('detiene el sondeo al desmontarse mientras el OCR sigue activo', async () => {
    vi.useFakeTimers();
    const documento = documentosCasoDemo.find((item) => item.estadoOcr === 'En cola');
    if (!documento) throw new Error('Falta un documento sintético en cola');
    const fetchMock = responder({ documentos: [] });
    const { unmount } = render(
      <DocumentsScreen
        documents={[documento]}
        casoId={casoDocumentosDemo.casoId}
        pacienteNombre={casoDocumentosDemo.pacienteNombre}
        onDownload={() => undefined}
        onUpload={() => undefined}
      />,
    );

    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
