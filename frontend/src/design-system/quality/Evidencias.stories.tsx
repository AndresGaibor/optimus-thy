import type { Meta, StoryObj } from '@storybook/react-vite';
import { Callout, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '..';
import capturas from '../../../e2e/capturas.json';

type Captura = { id: string; titulo: string; estado: string };

const ITEMS = capturas as Captura[];

function EvidenciasGuia() {
  return (
    <main className="min-h-screen bg-background p-6 text-foreground sm:p-8">
      <div className="mx-auto max-w-(--content-max-width) space-y-8">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            Evidencia visual
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Índice de capturas (HT-106)</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Índice de la evidencia visual generada por Playwright sobre Storybook. Los datos salen
            de frontend/e2e/capturas.json; no se inventan pantallas ni estados.
          </p>
        </header>

        <section className="space-y-3 rounded-card border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">Qué es y dónde queda</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-control border border-border bg-surface-subtle p-3">
              <dt className="font-semibold">Manifiesto</dt>
              <dd className="mt-1 font-mono text-xs text-muted-foreground">
                frontend/e2e/capturas.json ({ITEMS.length} estados)
              </dd>
            </div>
            <div className="rounded-control border border-border bg-surface-subtle p-3">
              <dt className="font-semibold">PNGs generados</dt>
              <dd className="mt-1 font-mono text-xs text-muted-foreground">
                frontend/test-results/capturas/ (ignorados por git)
              </dd>
            </div>
          </dl>
          <Callout tone="warning" title="Abrir el PNG antes de opinar">
            Una captura es evidencia visual: revisa el PNG generado antes de dar por válido un
            estado. El manifiesto solo indexa qué se capturó, no garantiza el resultado visual.
          </Callout>
        </section>

        <section className="space-y-3 rounded-card border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">Comandos</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Todo:</span>{' '}
              <code className="rounded-control bg-surface-subtle px-1 py-0.5 font-mono text-xs">
                bun run capturar --todo
              </code>
            </li>
            <li>
              <span className="font-medium text-foreground">Por id de historia:</span>{' '}
              <code className="rounded-control bg-surface-subtle px-1 py-0.5 font-mono text-xs">
                bun run capturar --solo &lt;id&gt;[,&lt;id&gt;...]
              </code>
            </li>
            <li>
              <span className="font-medium text-foreground">Ruta de salida:</span> cada PNG se
              guarda bajo frontend/test-results/capturas/ según el id del manifiesto.
            </li>
          </ul>
        </section>

        <section className="space-y-3 rounded-card border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">Estados documentados</h2>
          <p className="text-sm text-muted-foreground">
            Pantalla, estado declarado y qué prueba (id de historia en el manifiesto).
          </p>
          <Table caption="Índice de capturas visuales" aria-label="Índice de capturas visuales">
            <TableHeader>
              <TableRow>
                <TableHead>Pantalla</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Qué prueba (id)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ITEMS.map((fila) => (
                <TableRow key={fila.id}>
                  <TableCell>{fila.titulo}</TableCell>
                  <TableCell className="font-medium">{fila.estado}</TableCell>
                  <TableCell className="font-mono text-xs">{fila.id}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      </div>
    </main>
  );
}

const meta = {
  title: 'Guías y calidad/Evidencias visuales',
  component: EvidenciasGuia,
  tags: ['ai-generated'],
} satisfies Meta<typeof EvidenciasGuia>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Indice: Story = {};
