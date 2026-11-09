import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Callout, EmptyState, Spinner } from '..';

function EstadosGuia() {
  return (
    <main className="min-h-screen bg-background p-6 text-foreground sm:p-8">
      <div className="mx-auto max-w-(--content-max-width) space-y-8">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            Guía de estados
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Carga, vacío, error y sin permiso
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Usa componentes reales y mensajes que indiquen qué hacer a continuación. No inventes
            pantallas nuevas para estos estados.
          </p>
        </header>

        <section className="space-y-3 rounded-card border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">Carga</h2>
          <p className="text-sm text-muted-foreground">
            Úsalo mientras se obtienen datos. Mantén el contexto visible y explica qué se está
            cargando.
          </p>
          <div
            className="flex items-center gap-3 rounded-card border border-border bg-surface-subtle p-4"
            aria-busy="true"
          >
            <Spinner label="Cargando información" />
            <p className="text-sm text-muted-foreground">
              Cargando la información solicitada. Espera un momento antes de volver a intentarlo.
            </p>
          </div>
        </section>

        <section className="space-y-3 rounded-card border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">Vacío</h2>
          <p className="text-sm text-muted-foreground">
            Úsalo cuando no hay datos todavía. Indica por qué está vacío y cuál es la siguiente
            acción útil.
          </p>
          <EmptyState
            title="Sin resultados"
            description="No hay elementos para mostrar. Revisa los filtros o crea un nuevo registro para continuar."
            action={<Button>Crear registro</Button>}
          />
        </section>

        <section className="space-y-3 rounded-card border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">Error</h2>
          <p className="text-sm text-muted-foreground">
            Úsalo cuando una acción falla. El mensaje debe decir qué ocurrió y qué puede hacer la
            persona usuaria.
          </p>
          <Callout tone="danger" title="No se pudo cargar la información">
            <p>
              Revisa tu conexión y vuelve a intentarlo. Si el problema continúa, recarga la página o
              contacta al equipo responsable.
            </p>
            <div className="mt-3">
              <Button variant="outline">Reintentar</Button>
            </div>
          </Callout>
        </section>

        <section className="space-y-3 rounded-card border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">Sin permiso</h2>
          <p className="text-sm text-muted-foreground">
            Úsalo cuando la persona no tiene acceso. Evita exponer datos y ofrece una salida clara.
          </p>
          <Callout tone="warning" title="No tienes permiso para ver esta sección">
            Solicita acceso al administrador o vuelve al inicio para continuar con las tareas
            disponibles para tu rol.
          </Callout>
        </section>
      </div>
    </main>
  );
}

const meta = {
  title: 'Sistema de diseño/Patrones/Estados',
  component: EstadosGuia,
  tags: ['ai-generated'],
} satisfies Meta<typeof EstadosGuia>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Guia: Story = {};
