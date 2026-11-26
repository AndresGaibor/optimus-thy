import { Button } from '../../design-system/components/atoms/Button';
import { Callout } from '../../design-system/components/molecules/Callout';
import { Dialog, DialogClose } from '../../design-system/components/organisms/Dialog';
import type { Paciente } from '../../api/pacientes';

const ETIQUETA_ARCHIVAR = 'Archivar paciente';
const ETIQUETA_DESARCHIVAR = 'Desarchivar paciente';

interface DialogoArchivadoPacienteProps {
  paciente: Paciente | null;
  cargando: boolean;
  error: string | null;
  onConfirmar: () => void;
  onCerrar: () => void;
}

/**
 * Confirmación de archivado o desarchivado.
 *
 * Los datos del paciente no se borran en ninguna de las dos transiciones, así que
 * el texto lo dice explícitamente antes de confirmar.
 */
export function DialogoArchivadoPaciente({
  paciente,
  cargando,
  error,
  onConfirmar,
  onCerrar,
}: DialogoArchivadoPacienteProps) {
  const desarchivar = paciente?.archivado_en != null;

  return (
    <Dialog
      open={paciente !== null}
      onOpenChange={(abierto) => {
        if (!abierto) {
          onCerrar();
        }
      }}
      title={desarchivar ? ETIQUETA_DESARCHIVAR : ETIQUETA_ARCHIVAR}
      description={
        desarchivar
          ? 'El paciente volverá a aparecer en el listado. Sus datos y casos se conservarán.'
          : 'Los datos y casos se conservarán. El paciente no podrá recibir casos nuevos.'
      }
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <DialogClose asChild>
            <Button variant="secondary" disabled={cargando}>
              Cancelar
            </Button>
          </DialogClose>
          <Button onClick={onConfirmar} disabled={cargando}>
            {cargando ? 'Guardando...' : desarchivar ? ETIQUETA_DESARCHIVAR : ETIQUETA_ARCHIVAR}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {error ? (
          <Callout tone="danger" role="alert">
            {error}
          </Callout>
        ) : null}
        <p className="text-sm text-muted-foreground">{paciente?.codigo}</p>
      </div>
    </Dialog>
  );
}
