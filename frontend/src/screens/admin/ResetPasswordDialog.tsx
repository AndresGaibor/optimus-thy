import { Button, Callout, Dialog } from '../../design-system';
import type { RoleKey } from '../../design-system';
import type { DemoUser } from '../fixtures/types';

type ResetTarget = DemoUser & { roles?: RoleKey[]; rolActivo?: RoleKey };

export function ResetPasswordDialog({
  user,
  onClose,
  onConfirm,
}: {
  user: ResetTarget;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Restablecer contraseña"
      description={`Usuario: ${user.nombre} (${user.email})`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onConfirm}>Confirmar restablecimiento</Button>
        </>
      }
    >
      <div className="space-y-3">
        <Callout tone="warning" title="Cambio obligatorio">
          Se le exigirá cambiarla en el siguiente inicio de sesión. Este flujo no usa correo
          externo.
        </Callout>
        <p className="text-sm text-muted-foreground">
          La acción quedará registrada en bitácora como evento administrativo de seguridad.
        </p>
      </div>
    </Dialog>
  );
}
