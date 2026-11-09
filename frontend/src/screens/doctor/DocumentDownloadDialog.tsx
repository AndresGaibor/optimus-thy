import { Button, Callout, Dialog } from '../../design-system';
import type { DescargaDocumentoDemo, DocumentoCasoDemo } from '../fixtures/documentos-extra';

export function DocumentDownloadDialog({
  document,
  download,
  onOpenChange,
  onConfirm,
}: {
  document: DocumentoCasoDemo | null;
  download: DescargaDocumentoDemo;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open={Boolean(document)}
      onOpenChange={onOpenChange}
      title="Acceso al documento"
      description="Se requiere permiso y el acceso queda registrado."
    >
      {document ? (
        <div className="space-y-3 text-sm">
          <Callout tone="warning" title="Permiso y trazabilidad">
            Solo personal autorizado puede ver o descargar. El evento se registra en bitácora.
          </Callout>
          <p>
            <span className="font-medium">Documento:</span> {document.nombre} ({document.id})
          </p>
          <p>
            <span className="font-medium">Enlace firmado simulado:</span>
          </p>
          <p className="break-all rounded-control border border-border-subtle bg-background p-2 text-xs">
            {download.enlaceFirmado}
          </p>
          <Callout tone="info" title="Evento registrado">
            Usuario: {download.usuario} · Rol: {download.rol} · Hora: {download.hora} · Documento:{' '}
            {document.id}.
          </Callout>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
            <Button onClick={onConfirm}>Confirmar acceso</Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
