import { Link } from 'react-router-dom';
import { Button } from '../design-system/components/atoms/Button';
import { Card } from '../design-system/components/atoms/Card';
import { Callout } from '../design-system/components/molecules/Callout';
import { EmptyState } from '../design-system/components/molecules/EmptyState';
import { PageHeader } from '../design-system/components/molecules/PageHeader';
import { useSession } from '../session/SessionContext';
import { homePathFor } from '../session/roles';

export function PlaceholderPage({ titulo }: { titulo: string }) {
  const { rolActivo } = useSession();

  return (
    <section className="mx-auto w-full max-w-(--content-max-width) space-y-6 px-4 py-6">
      <PageHeader
        title={titulo}
        description="Este módulo se habilita con la historia correspondiente."
      />
      <Callout tone="info" title="Vista en preparación">
        Esta vista aún no está conectada a la funcionalidad correspondiente.
      </Callout>
      <Card className="p-0">
        <EmptyState
          title="Módulo no disponible"
          description="El contenido de este módulo se incorporará en la historia correspondiente."
          action={
            <Button asChild>
              <Link to={rolActivo ? homePathFor(rolActivo) : '/'}>Ir a mi inicio</Link>
            </Button>
          }
        />
      </Card>
    </section>
  );
}
