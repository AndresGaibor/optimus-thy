/* eslint-disable @typescript-eslint/no-explicit-any */

function TypeAndLayout() {
  return (
    <main className="min-h-screen bg-background p-6 text-foreground sm:p-8">
      <div className="mx-auto max-w-(--content-max-width) space-y-8">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            Fundamentos · jerarquía y espacio
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Una jerarquía clínica clara</h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            El contenido prioriza el contexto, conserva la legibilidad y separa los datos de apoyo
            de las acciones.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
          <article className="space-y-5 rounded-card border border-border bg-surface p-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Título de página · 3xl
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                Revisión de un caso sintético
              </h2>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Subtítulo · base
              </p>
              <p className="mt-1 text-base">Datos de apoyo para orientar la revisión clínica.</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Texto secundario · sm
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Las etiquetas y los valores permanecen distinguibles en ambos temas.
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Metadatos · xs
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                DEMO-HC-001 · Demostración sintética
              </p>
            </div>
          </article>

          <aside className="space-y-4 rounded-card border border-border bg-surface-subtle p-5">
            <h2 className="text-base font-semibold">Ritmo de espacio</h2>
            <p className="text-sm text-muted-foreground">
              Usa la escala de Tailwind compartida; no introduzcas valores aislados por pantalla.
            </p>
            <div className="space-y-3" aria-label="Ejemplos de espaciado">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Compacto · gap-2</p>
                <div className="flex gap-2">
                  <span className="h-3 flex-1 rounded-sm bg-brand" />
                  <span className="h-3 flex-1 rounded-sm bg-brand/50" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Regular · gap-4</p>
                <div className="flex gap-4">
                  <span className="h-3 flex-1 rounded-sm bg-brand" />
                  <span className="h-3 flex-1 rounded-sm bg-brand/50" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Amplio · gap-6</p>
                <div className="flex gap-6">
                  <span className="h-3 flex-1 rounded-sm bg-brand" />
                  <span className="h-3 flex-1 rounded-sm bg-brand/50" />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
              <span className="rounded-control border border-border bg-surface px-3 py-1.5 text-xs">
                control
              </span>
              <span className="rounded-card border border-border bg-surface px-3 py-1.5 text-xs">
                card
              </span>
              <span className="rounded-panel border border-border bg-surface px-3 py-1.5 text-xs">
                panel
              </span>
            </div>
          </aside>
        </section>

        <p className="text-xs text-muted-foreground">
          Las ilustraciones de esta story no representan un paciente real ni un resultado de modelo.
        </p>
      </div>
    </main>
  );
}

const meta = {
  title: 'Sistema de diseño/Fundamentos/Tipografía en contexto',
  tags: ['ai-generated'],
};

export default meta;

export const Default: any = (args: any) => <TypeAndLayout {...args} />;
