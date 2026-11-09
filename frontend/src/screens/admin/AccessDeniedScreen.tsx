import { Button, Callout } from '../../design-system';
import { DemoRoleLayout } from '../shared/DemoRoleLayout';
import { ScreenFrame } from '../shared/ScreenFrame';

export function AccessDeniedScreen({
  permiso = 'administracion.instituciones.editar',
  motivo = 'Tu rol no cuenta con este permiso.',
  onBack = () => {},
}: {
  permiso?: string;
  motivo?: string;
  onBack?: () => void;
}) {
  return (
    <DemoRoleLayout role="administrador">
      <ScreenFrame
        title="Acceso denegado"
        description="La operación solicitada no está disponible para esta cuenta."
      >
        <div className="mx-auto w-full max-w-3xl space-y-5">
          <Callout tone="danger" title="Operación denegada" role="alert">
            <p>{motivo}</p>
            <p className="mt-2">
              Permiso faltante: <code className="rounded bg-surface-subtle px-1">{permiso}</code>
            </p>
          </Callout>
          <p className="text-sm text-muted-foreground">
            Este intento queda registrado en la bitácora de seguridad.
          </p>
          <Button onClick={onBack}>Volver</Button>
        </div>
      </ScreenFrame>
    </DemoRoleLayout>
  );
}
