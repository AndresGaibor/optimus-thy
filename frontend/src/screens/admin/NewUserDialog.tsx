import { Button, Dialog, Field, Input, Select } from '../../design-system';
import type { RoleKey } from '../../design-system';
import type { DemoUser } from '../fixtures/types';

type NewUserForm = Pick<DemoUser, 'nombre' | 'email' | 'rol' | 'institucion'>;

const ROLE_KEYS = ['medico', 'investigador', 'administrador'] as RoleKey[];
const ROLE_LABELS: Record<RoleKey, string> = {
  medico: 'Médico',
  investigador: 'Investigador',
  administrador: 'Administrador',
};
const NOT_BLANK = '.*\\S.*';

export function NewUserDialog({
  open,
  form,
  onFormChange,
  onClose,
  onCreate,
}: {
  open: boolean;
  form: NewUserForm;
  onFormChange: (form: NewUserForm) => void;
  onClose: () => void;
  onCreate: (user: NewUserForm) => void;
}) {
  if (!open) return null;

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Nuevo usuario demo"
      description="Completa datos ficticios; no se creará una cuenta real."
    >
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          onCreate({
            nombre: form.nombre.trim(),
            email: form.email.trim(),
            rol: form.rol,
            institucion: form.institucion.trim(),
          });
          onClose();
        }}
      >
        <Field label="Nombre de demostración" required>
          <Input
            name="nombre"
            autoComplete="off"
            pattern={NOT_BLANK}
            title="Escribe al menos un carácter que no sea un espacio."
            placeholder="Usuario demo"
            value={form.nombre}
            onChange={(event) => onFormChange({ ...form, nombre: event.target.value })}
          />
        </Field>
        <Field label="Correo de ejemplo" required>
          <Input
            name="email"
            type="email"
            autoComplete="off"
            placeholder="usuario@example.test"
            value={form.email}
            onChange={(event) => onFormChange({ ...form, email: event.target.value })}
          />
        </Field>
        <Field label="Institución de demostración" required>
          <Input
            name="institucion"
            autoComplete="off"
            pattern={NOT_BLANK}
            title="Escribe al menos un carácter que no sea un espacio."
            placeholder="Institución demo"
            value={form.institucion}
            onChange={(event) => onFormChange({ ...form, institucion: event.target.value })}
          />
        </Field>
        <Field label="Rol">
          <Select
            name="rol"
            value={form.rol}
            onChange={(event) => onFormChange({ ...form, rol: event.target.value as RoleKey })}
          >
            {ROLE_KEYS.map((key) => (
              <option key={key} value={key}>
                {ROLE_LABELS[key]}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">Agregar usuario demo</Button>
        </div>
      </form>
    </Dialog>
  );
}

export { ROLE_KEYS, ROLE_LABELS };
export type { NewUserForm };
