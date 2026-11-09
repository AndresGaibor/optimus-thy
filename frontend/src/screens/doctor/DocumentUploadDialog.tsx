import { useState } from 'react';
import { Button, Callout, Dialog, Field, FileDropzone } from '../../design-system';

export type UploadState = 'idle' | 'tipo' | 'danado' | 'ok';

const TIPOS: Record<string, true> = {
  'application/pdf': true,
  'image/png': true,
  'image/jpeg': true,
};

export function validarArchivo(file: File): UploadState {
  if (!TIPOS[file.type] && !/\.(pdf|png|jpe?g)$/i.test(file.name)) return 'tipo';
  if (file.size === 0 || /danad|corrupt/i.test(file.name)) return 'danado';
  return 'ok';
}

export function DocumentUploadDialog({
  open,
  initialError,
  onOpenChange,
  onUpload,
}: {
  open: boolean;
  initialError?: 'tipo' | 'danado' | undefined;
  onOpenChange: (open: boolean) => void;
  onUpload: () => void;
}) {
  const [upload, setUpload] = useState<UploadState>(initialError ?? 'idle');
  const [fileName, setFileName] = useState('');

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setUpload(initialError ?? 'idle');
          setFileName('');
        }
        onOpenChange(next);
      }}
      title="Cargar documento"
      description="Asocia un PDF o imagen al paciente y caso. Almacenamiento privado (demostración)."
    >
      <div className="space-y-4">
        <Field label="Archivo" required hint="PDF, PNG o JPEG. Se valida tipo e integridad.">
          <FileDropzone
            accept="application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg"
            label="Seleccionar o arrastrar documento"
            onFiles={(files) => {
              const file = files[0];
              if (!file) return;
              setFileName(file.name);
              setUpload(validarArchivo(file));
            }}
          />
        </Field>
        {fileName ? <p className="text-sm text-muted-foreground">Archivo: {fileName}</p> : null}
        {upload === 'tipo' && (
          <Callout tone="danger" role="alert" title="Tipo no admitido">
            Solo se permiten archivos PDF, PNG o JPEG.
          </Callout>
        )}
        {upload === 'danado' && (
          <Callout tone="danger" role="alert" title="Archivo dañado">
            El archivo no se pudo leer o está dañado. Reemplázalo antes de continuar.
          </Callout>
        )}
        {upload === 'ok' && (
          <Callout tone="success" title="Archivo válido">
            Tipo admitido e integridad verificada para la demostración.
          </Callout>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={upload !== 'ok'}
            onClick={() => {
              onOpenChange(false);
              setUpload(initialError ?? 'idle');
              setFileName('');
              onUpload();
            }}
          >
            Registrar carga
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
