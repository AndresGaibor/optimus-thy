import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { obtenerEnlaceDocumento } from '../api/documentos';
import { DocumentsScreen } from '../screens/doctor/DocumentsScreen';
import { casoDocumentosDemo, documentosCasoDemo } from '../screens/fixtures/documentos-extra';

function responder(cuerpo: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(cuerpo), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function documentoListo() {
  const documento = documentosCasoDemo.find((item) => item.estadoOcr === 'Listo');
  if (!documento) throw new Error('Falta un documento sintético listo para descargar');
  return documento;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('obtenerEnlaceDocumento', () => {
  it('pide el enlace del documento y conserva la caducidad', async () => {
    const enlace = {
      enlace: 'https://storage.local/documentos/demo.pdf?firma=abc',
      caduca_en: '2026-03-18T10:40:00Z',
    };
    const fetchMock = responder(enlace);

    await expect(obtenerEnlaceDocumento('caso-1', 'doc-1')).resolves.toEqual(enlace);
    const request = fetchMock.mock.calls[0]?.[0];
    if (!(request instanceof Request)) {
      throw new Error('La solicitud del enlace no se realizó mediante Request');
    }
    expect(request.method).toBe('POST');
    expect(request.url).toContain('/casos/caso-1/documentos/doc-1/enlace');
  });

  it('devuelve null cuando el backend rechaza la solicitud', async () => {
    responder({ error: { code: 'storage_error', message: 'No se pudo firmar el enlace' } }, 502);

    await expect(obtenerEnlaceDocumento('caso-1', 'doc-1')).resolves.toBeNull();
  });

  it('devuelve null cuando la respuesta no tiene la forma esperada', async () => {
    responder({ enlace: 42 });

    await expect(obtenerEnlaceDocumento('caso-1', 'doc-1')).resolves.toBeNull();
  });
});

describe('DocumentsScreen sin enlace firmado', () => {
  it('muestra el error con Callout y deshabilita la apertura al descargar', async () => {
    const fetchMock = responder(
      { error: { code: 'storage_error', message: 'No se pudo firmar el enlace' } },
      502,
    );
    const usuario = userEvent.setup();

    render(
      <DocumentsScreen
        documents={[documentoListo()]}
        casoId={casoDocumentosDemo.casoId}
        pacienteNombre={casoDocumentosDemo.pacienteNombre}
        onDownload={() => undefined}
        onUpload={() => undefined}
      />,
    );

    await usuario.click(screen.getByRole('button', { name: 'Descargar' }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    expect(screen.getByText('No se pudo obtener el enlace')).toBeInTheDocument();
    expect(
      screen.getByText(
        'No se pudo obtener el enlace firmado. Vuelve a intentarlo en unos segundos.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abrir enlace firmado' })).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Descarga registrada')).not.toBeInTheDocument();
  });

  it('muestra el error del sistema de diseño al ver un documento sin enlace', async () => {
    responder({ error: { code: 'storage_error', message: 'No se pudo firmar el enlace' } }, 502);
    const usuario = userEvent.setup();

    render(
      <DocumentsScreen
        documents={[documentoListo()]}
        casoId={casoDocumentosDemo.casoId}
        pacienteNombre={casoDocumentosDemo.pacienteNombre}
        onDownload={() => undefined}
        onUpload={() => undefined}
      />,
    );

    await usuario.click(screen.getByRole('button', { name: 'Ver' }));

    await waitFor(() => {
      expect(
        screen.getByText(
          'No se pudo obtener el enlace firmado. Vuelve a intentarlo en unos segundos.',
        ),
      ).toBeInTheDocument();
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
