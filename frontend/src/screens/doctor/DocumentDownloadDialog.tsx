import { Button, Callout, Dialog, Spinner } from '../../design-system';
import type { DocumentoCasoDemo } from '../fixtures/documentos-extra';

/** Estado del enlace firmado que el backend emite para abrir o descargar. */
export type EstadoDescargaDocumento =
  | { estado: 'cargando' }
  | { estado: 'listo'; enlace: string; caducaEn: string }
  | { estado: 'error'; mensaje: string };

function vigencia(caducaEn: string): string {
  const fecha = new Date(caducaEn);
  if (Number.isNaN(fecha.getTime())) return caducaEn;
  return fecha.toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' });
}

export function DocumentDownloadDialog({
  document,
  descarga,
  onOpenChange,
  onConfirm,
}: {
  document: DocumentoCasoDemo | null;
  descarga: EstadoDescargaDocumento | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open={Boolean(document)}
      onOpenChange={onOpenChange}
      title="Acceso al documento"
      description="Se requiere permiso y el acceso queda registrado."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button onClick={onConfirm} disabled={descarga?.estado !== 'listo'}>
            Abrir enlace firmado
          </Button>
        </>
      }
    >
      {document ? (
        <div className="space-y-3 text-sm">
          <Callout tone="warning" title="Permiso y trazabilidad">
            Solo personal autorizado puede ver o descargar. El evento se registra en bitácora.
          </Callout>
          <p>
            <span className="font-medium">Documento:</span> {document.nombre} ({document.id})
          </p>
          {descarga?.estado === 'cargando' ? (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Spinner size="sm" label="Obteniendo el enlace firmado" />
              Obteniendo el enlace firmado…
            </p>
          ) : null}
          {descarga?.estado === 'listo' ? (
            <>
              <p>
                <span className="font-medium">Enlace firmado:</span>
              </p>
              <p className="break-all rounded-control border border-border-subtle bg-background p-2 text-xs">
                {descarga.enlace}
              </p>
              <Callout tone="info" title="Enlace de corta vida">
                Caduca el {vigencia(descarga.caducaEn)}. Abrirlo queda registrado en la bitácora.
              </Callout>
            </>
          ) : null}
          {descarga?.estado === 'error' ? (
            <Callout tone="danger" title="No se pudo obtener el enlace">
              {descarga.mensaje}
            </Callout>
          ) : null}
        </div>
      ) : null}
    </Dialog>
  );
}
