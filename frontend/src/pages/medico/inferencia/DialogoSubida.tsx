import {
  Badge,
  Button,
  Dialog,
  DialogClose,
  FileDropzone,
  Progress,
  type BadgeTone,
} from '../../../design-system';
import type { ArchivoEnSubida, EstadoArchivo } from './useSubidaEcografia';

interface DialogoSubidaProps {
  /** Estado de apertura del diálogo. */
  abierto: boolean;
  /** Archivos elegidos con el resultado de su subida. */
  archivos: ArchivoEnSubida[];
  /** Indica si hay una subida en curso. */
  guardando: boolean;
  /** Notifica los cambios de apertura del diálogo. */
  onCambiarApertura: (abierto: boolean) => void;
  /** Recibe los archivos soltados o elegidos. */
  onArchivo: (archivos: File[]) => void;
  /** Ejecuta la subida de los archivos pendientes o fallidos. */
  onSubir: () => void;
}

const ETIQUETA: Record<EstadoArchivo, string> = {
  en_cola: 'En cola',
  subiendo: 'Subiendo',
  lista: 'Lista',
  error: 'Error',
  rechazado: 'Rechazado',
};

const TONO: Record<EstadoArchivo, BadgeTone> = {
  en_cola: 'neutral',
  subiendo: 'info',
  lista: 'success',
  error: 'danger',
  rechazado: 'danger',
};

/** Diálogo para cargar una o varias ecografías PNG o JPEG al caso. */
export function DialogoSubida({
  abierto,
  archivos,
  guardando,
  onCambiarApertura,
  onArchivo,
  onSubir,
}: DialogoSubidaProps) {
  const total = archivos.filter((item) => item.estado !== 'rechazado').length;
  const listas = archivos.filter((item) => item.estado === 'lista').length;
  const hayFallidos = archivos.some((item) => item.estado === 'error');
  const puedeSubir = archivos.some((item) => item.estado === 'en_cola' || item.estado === 'error');

  return (
    <Dialog
      open={abierto}
      onOpenChange={onCambiarApertura}
      title="Subir ecografías"
      description="Cada archivo se guarda como una copia saneada, sin metadatos EXIF ni ICC."
      footer={
        <>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={onSubir} disabled={!puedeSubir} loading={guardando}>
            {hayFallidos ? 'Reintentar subida' : 'Subir ecografía'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FileDropzone
          accept="image/png,image/jpeg"
          multiple
          label="Selecciona una o varias ecografías PNG o JPEG"
          hint="Máximo 15 MB por archivo. La copia se guarda sin metadatos."
          onFiles={onArchivo}
        />
        {archivos.length > 0 ? (
          <div className="flex flex-col gap-3">
            {guardando ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground" role="status">
                  {listas} de {total} archivos listos.
                </p>
                <Progress label="Avance de la subida" value={listas} max={Math.max(total, 1)} />
              </div>
            ) : null}
            <ul aria-label="Archivos elegidos" className="flex flex-col gap-2">
              {archivos.map((item) => (
                <li
                  key={`${item.archivo.name}:${item.archivo.size}:${item.archivo.lastModified}`}
                  className="flex flex-col gap-1 rounded-md border border-border p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm">
                      Archivo seleccionado: {item.archivo.name}
                    </span>
                    <Badge tone={TONO[item.estado]}>{ETIQUETA[item.estado]}</Badge>
                  </div>
                  {item.error ? (
                    <p className="text-sm font-medium text-danger">{item.error}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Dialog>
  );
}
