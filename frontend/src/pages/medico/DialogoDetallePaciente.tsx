import type { PacienteDetalle } from '../../api/pacientes';
import { Button } from '../../design-system/components/atoms/Button';
import { Label } from '../../design-system/components/atoms/Label';
import { Spinner } from '../../design-system/components/atoms/Spinner';
import { Callout } from '../../design-system/components/molecules/Callout';
import { EmptyState } from '../../design-system/components/molecules/EmptyState';
import { Dialog, DialogClose } from '../../design-system/components/organisms/Dialog';
import { CasosDelPaciente } from './CasosDelPaciente';
import { formatearFecha } from './formato';

interface DialogoDetallePacienteProps {
  abierto: boolean;
  onAbiertoChange: (abierto: boolean) => void;
  cargando: boolean;
  error: string | null;
  paciente: PacienteDetalle | null;
}

/** Detalle de solo lectura del paciente y sus casos; no edita ni borra nada. */
export function DialogoDetallePaciente({
  abierto,
  onAbiertoChange,
  cargando,
  error,
  paciente,
}: DialogoDetallePacienteProps) {
  return (
    <Dialog
      open={abierto}
      onOpenChange={onAbiertoChange}
      title="Detalle del paciente"
      description="Información del paciente y sus casos asociados."
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <DialogClose asChild>
            <Button variant="secondary">Cerrar</Button>
          </DialogClose>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {cargando ? (
          <div className="flex items-center justify-center py-6">
            <Spinner aria-label="Cargando detalle" />
          </div>
        ) : error ? (
          <Callout tone="danger" role="alert">
            {error}
          </Callout>
        ) : paciente ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <Label>Código</Label>
                <div className="text-sm text-foreground">{paciente.codigo}</div>
              </div>
              <div className="flex flex-col gap-1">
                <Label>Casos</Label>
                <div className="text-sm text-foreground">{paciente.total_casos}</div>
              </div>
              <div className="flex flex-col gap-1 sm:col-span-2">
                <Label>Alta</Label>
                <div className="text-sm text-foreground">{formatearFecha(paciente.creado_en)}</div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium text-foreground">Casos</div>
              {paciente.casos && paciente.casos.length > 0 ? (
                <CasosDelPaciente casos={paciente.casos} />
              ) : (
                <EmptyState
                  as="h2"
                  title="Sin casos registrados"
                  description="Este paciente aún no tiene casos asociados."
                />
              )}
            </div>
          </>
        ) : null}
      </div>
    </Dialog>
  );
}
