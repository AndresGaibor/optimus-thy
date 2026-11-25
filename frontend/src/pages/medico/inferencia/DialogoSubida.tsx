import { Button, Callout, Dialog, DialogClose, FileDropzone } from '../../../design-system';

interface DialogoSubidaProps {
  /** Estado de apertura del diálogo. */
  abierto: boolean;
  /** Archivo elegido para subir. */
  archivo: File | null;
  /** Error de validación o de subida. */
  error: string | null;
  /** Indica si la subida está en curso. */
  guardando: boolean;
  /** Notifica los cambios de apertura del diálogo. */
  onCambiarApertura: (abierto: boolean) => void;
  /** Recibe los archivos soltados o elegidos. */
  onArchivo: (archivos: File[]) => void;
  /** Ejecuta la subida del archivo elegido. */
  onSubir: () => void;
}

/** Diálogo para cargar una ecografía PNG o JPEG al caso. */
export function DialogoSubida({
  abierto,
  archivo,
  error,
  guardando,
  onCambiarApertura,
  onArchivo,
  onSubir,
}: DialogoSubidaProps) {
  return (
    <Dialog
      open={abierto}
      onOpenChange={onCambiarApertura}
      title="Subir ecografía"
      description="Se guarda una copia saneada, sin metadatos EXIF ni ICC."
      footer={
        <>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={onSubir} disabled={archivo === null} loading={guardando}>
            Subir ecografía
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error ? (
          <Callout tone="danger" title="No se pudo subir" role="alert">
            {error}
          </Callout>
        ) : null}
        <FileDropzone
          accept="image/png,image/jpeg"
          label="Selecciona una ecografía PNG o JPEG"
          hint="Máximo 15 MB. La copia se guarda sin metadatos."
          onFiles={onArchivo}
        />
        {archivo ? (
          <p className="text-sm text-muted-foreground">Archivo seleccionado: {archivo.name}</p>
        ) : null}
      </div>
    </Dialog>
  );
}
