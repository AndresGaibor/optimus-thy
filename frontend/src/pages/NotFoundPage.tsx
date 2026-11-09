import { Link, useNavigate } from 'react-router-dom';
import { BrandMark } from '../design-system/components/atoms/BrandMark';
import { Button } from '../design-system/components/atoms/Button';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main
      id="contenido"
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface-subtle px-4 py-10 text-center text-foreground"
    >
      <BrandMark size="lg" />
      <p className="text-6xl font-bold tracking-tight text-brand">404</p>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Página no encontrada</h1>
        <p className="max-w-prose text-muted-foreground">
          La dirección que abriste no existe o ya no está disponible.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link to="/">Volver al inicio</Link>
        </Button>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Volver atrás
        </Button>
      </div>
    </main>
  );
}
