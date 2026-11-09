import { Button } from '../design-system/components/atoms/Button';
import { Callout } from '../design-system/components/molecules/Callout';

export function ErrorScreen({
  onReintentar,
  titulo = 'Ocurrió un error',
}: {
  onReintentar?: () => void;
  titulo?: string;
}) {
  // Nunca se muestran detalles internos del error (trazas, SQL, rutas).
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Callout role="alert" tone="danger" title={titulo} className="w-full max-w-lg">
        <div className="space-y-4">
          <p>No pudimos completar la operación. Inténtalo de nuevo en unos minutos.</p>
          {onReintentar ? (
            <Button variant="outline" onClick={onReintentar}>
              Reintentar
            </Button>
          ) : null}
        </div>
      </Callout>
    </div>
  );
}
