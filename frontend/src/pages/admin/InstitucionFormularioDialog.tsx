import { Button, Callout, Dialog, DialogClose, Field, Input } from '../../design-system';
import type { InstitucionAdmin } from '../../api/instituciones';

export interface FormularioInstitucion {
  nombre: string;
  codigo: string;
}

export interface InstitucionFormularioDialogProps {
  abierto: boolean;
  onAbiertoChange: (abierto: boolean) => void;
  editando: InstitucionAdmin | null;
  formulario: FormularioInstitucion;
  onFormulario: (formulario: FormularioInstitucion) => void;
  errores: Record<string, string>;
  errorFormulario: string | null;
  guardando: boolean;
  onGuardar: () => void;
}

/** Diálogo de alta y edición de una institución. */
export function InstitucionFormularioDialog({
  abierto,
  onAbiertoChange,
  editando,
  formulario,
  onFormulario,
  errores,
  errorFormulario,
  guardando,
  onGuardar,
}: InstitucionFormularioDialogProps) {
  return (
    <Dialog
      open={abierto}
      onOpenChange={onAbiertoChange}
      title={editando ? 'Editar institución' : 'Nueva institución'}
      description="Define el nombre y el código legible de la institución."
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <DialogClose asChild>
            <Button variant="secondary">Cancelar</Button>
          </DialogClose>
          <Button onClick={onGuardar} disabled={guardando}>
            {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {errorFormulario ? (
          <Callout tone="danger" role="alert">
            <p>{errorFormulario}</p>
          </Callout>
        ) : null}
        <Field label="Nombre" required error={errores.nombre}>
          <Input
            value={formulario.nombre}
            onChange={(evento) => onFormulario({ ...formulario, nombre: evento.target.value })}
          />
        </Field>
        <Field label="Código" required error={errores.codigo}>
          <Input
            value={formulario.codigo}
            onChange={(evento) => onFormulario({ ...formulario, codigo: evento.target.value })}
          />
        </Field>
      </div>
    </Dialog>
  );
}
