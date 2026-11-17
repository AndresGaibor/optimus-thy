import { Button, Dialog, DialogClose } from '../../design-system';

export interface InstitucionDesactivarDialogProps {
  abierto: boolean;
  onAbiertoChange: (abierto: boolean) => void;
  codigo: string | undefined;
  onConfirmar: () => void;
}

/** Confirmación de desactivación: la institución conserva su historial. */
export function InstitucionDesactivarDialog({
  abierto,
  onAbiertoChange,
  codigo,
  onConfirmar,
}: InstitucionDesactivarDialogProps) {
  return (
    <Dialog
      open={abierto}
      onOpenChange={onAbiertoChange}
      title="Desactivar institución"
      description={
        codigo
          ? `Los usuarios activos de ${codigo} deben reasignarse antes de desactivarla. La institución no se elimina.`
          : 'Los usuarios activos deben reasignarse antes de desactivar la institución. La institución no se elimina.'
      }
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <DialogClose asChild>
            <Button variant="secondary">Cancelar</Button>
          </DialogClose>
          <Button variant="destructive" onClick={onConfirmar}>
            Desactivar
          </Button>
        </div>
      }
    />
  );
}
