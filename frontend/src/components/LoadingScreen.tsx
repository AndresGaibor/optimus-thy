import { Spinner } from '../design-system/components/atoms/Spinner';

export function LoadingScreen({ mensaje = 'Cargando…' }: { mensaje?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-6 text-muted-foreground">
      <Spinner />
      <p role="status" aria-live="polite">
        {mensaje}
      </p>
    </div>
  );
}
