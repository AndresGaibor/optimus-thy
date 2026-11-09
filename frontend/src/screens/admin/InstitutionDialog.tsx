import { Button, Dialog, Field, Input } from '../../design-system';
import type { DemoInstitution } from '../fixtures/admin-extra';

export type InstitutionForm = Pick<
  DemoInstitution,
  'codigo' | 'nombre' | 'estado' | 'usuariosActivos'
>;

const NOT_BLANK = '.*\\S.*';

export function InstitutionDialog({
  dialog,
  selected,
  form,
  onFormChange,
  onClose,
  onSave,
  onDeactivate,
}: {
  dialog: 'new' | 'edit' | 'deactivate' | null;
  selected: DemoInstitution | null;
  form: InstitutionForm;
  onFormChange: (form: InstitutionForm) => void;
  onClose: () => void;
  onSave: () => void;
  onDeactivate: () => void;
}) {
  return (
    <>
      {dialog === 'new' || dialog === 'edit' ? (
        <Dialog
          open
          title={dialog === 'new' ? 'Nueva institución' : 'Editar institución'}
          description="Completa los datos de demostración; no se guardan en un servidor."
          onOpenChange={(open) => {
            if (!open) onClose();
          }}
        >
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              onSave();
            }}
          >
            <Field label="Código de institución" required>
              <Input
                value={form.codigo}
                pattern={NOT_BLANK}
                title="El código es obligatorio."
                onChange={(event) => onFormChange({ ...form, codigo: event.target.value })}
              />
            </Field>
            <Field label="Nombre de institución" required>
              <Input
                value={form.nombre}
                pattern={NOT_BLANK}
                title="El nombre es obligatorio."
                onChange={(event) => onFormChange({ ...form, nombre: event.target.value })}
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">Guardar institución</Button>
            </div>
          </form>
        </Dialog>
      ) : null}
      {dialog === 'deactivate' && selected ? (
        <Dialog
          open
          title="Desactivar institución"
          description={`¿Desactivar ${selected.nombre}?`}
          onOpenChange={(open) => {
            if (!open) onClose();
          }}
          footer={
            <>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={onDeactivate}>
                Confirmar desactivación
              </Button>
            </>
          }
        >
          <p className="text-sm text-muted-foreground">
            Los usuarios asociados dejarán de poder seleccionar esta institución.
          </p>
        </Dialog>
      ) : null}
    </>
  );
}
