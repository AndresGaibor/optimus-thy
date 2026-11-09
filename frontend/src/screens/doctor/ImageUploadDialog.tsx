import { useId, useState, type FormEvent } from 'react';
import { Button, Dialog, Field, FileDropzone, Select } from '../../design-system';
import type { DemoPatient } from '../fixtures/types';

type UploadErrors = Partial<Record<'paciente' | 'archivo', string>>;

function UploadForm({ patients, onValid }: { patients: DemoPatient[]; onValid: () => void }) {
  const fileInputId = useId();
  const [errors, setErrors] = useState<UploadErrors>({});
  const [fileSelected, setFileSelected] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const next: UploadErrors = {};
    if (!String(new FormData(form).get('paciente') ?? ''))
      next.paciente = 'Selecciona un paciente demo.';
    if (!fileSelected) next.archivo = 'Elige un archivo PNG o JPEG para la demostración.';
    setErrors(next);
    const firstInvalid = next.paciente ? 'paciente' : next.archivo ? fileInputId : null;
    if (firstInvalid) {
      const control = form.elements.namedItem(firstInvalid);
      if (control instanceof HTMLElement) control.focus();
      return;
    }
    onValid();
  };
  return (
    <form noValidate onSubmit={submit} className="space-y-4">

      <Field label="Paciente demo" error={errors.paciente} required>
        <Select
          id="imagen-paciente"
          name="paciente"
          defaultValue=""
          aria-invalid={errors.paciente ? true : undefined}
        >
          <option value="">Selecciona un paciente demo</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Tipo de estudio" hint="Tipo de imagen sintética: ecografía o dermatoscopia.">
        <Select id="imagen-tipo" name="tipo" defaultValue="Ecografía">
          <option>Ecografía</option>
          <option>Dermatoscopia</option>
        </Select>
      </Field>
      <FileDropzone
        id={fileInputId}
        label="Imagen (demostración)"
        hint="PNG o JPEG · no se envía"
        accept="image/png,image/jpeg"
        onFiles={(files: File[]) => setFileSelected(files.length > 0)}
        error={errors.archivo}
      />
      <Button type="submit">Validar formulario de demostración</Button>
    </form>
  );
}

export function ImageUploadDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patients: DemoPatient[];
  onValid: () => void;
}) {
  return (
    <Dialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title="Solicitar carga de imagen"
      description="Formulario de demostración sintética: no se procesa ningún archivo."
    >
      <UploadForm patients={props.patients} onValid={props.onValid} />
    </Dialog>
  );
}
