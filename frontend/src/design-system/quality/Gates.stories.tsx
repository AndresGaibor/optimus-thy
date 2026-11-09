import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Callout, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '..';

const CONTROLES = [
  {
    gate: 'ui:check',
    bloquea: 'Controles crudos, colores literales, valores arbitrarios y estilos inline.',
    comando: 'cd frontend && bun run ui:check',
  },
  {
    gate: 'tamanos',
    bloquea: 'Archivos sobre el límite (baseline solo baja).',
    comando: 'cd frontend && bun run tamanos',
  },
];

const LIMITES = [
  { ambito: 'UI (componentes/pantallas)', limite: '220 líneas' },
  { ambito: 'Hooks', limite: '150 líneas' },
  { ambito: 'Resto de código', limite: '300 líneas' },
  {
    ambito: 'Fixtures / datos de prueba',
    limite: 'Excluidos del tope estricto (según regla de tamanos)',
  },
];

function Violacion() {
  return (
    <div className="rounded-card border border-border-danger bg-surface p-4 text-sm">
      <p className="font-semibold text-danger">Violación (evitar)</p>
      <p className="mt-1 text-muted-foreground">
        Usar un control crudo o un literal en lugar del design system, por ejemplo un botón nativo
        con clases ad hoc en vez de componer el componente compartido.
      </p>
      <div className="mt-3 rounded-control border border-border bg-surface-subtle p-3 font-mono text-xs text-muted-foreground">
        {'<button className="bg-blue-500 px-2">Guardar</button>'}
      </div>
    </div>
  );
}

function Arreglo() {
  return (
    <div className="rounded-card border border-border-success bg-surface p-4 text-sm">
      <p className="font-semibold text-success">Arreglo correcto</p>
      <p className="mt-1 text-muted-foreground">
        Componer con el design system (tokens y variantes). Si crece, extraer un subcomponente en
        lugar de inflar el archivo.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-control border border-border bg-surface-subtle p-3">
        <Button>Guardar</Button>
        <span className="font-mono text-xs text-muted-foreground">
          {'<Button>Guardar</Button>'}
        </span>
      </div>
    </div>
  );
}

function GatesGuia() {
  return (
    <main className="min-h-screen bg-background p-6 text-foreground sm:p-8">
      <div className="mx-auto max-w-(--content-max-width) space-y-8">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            Controles de calidad
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Gates del frontend (HT-026)</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Comprobaciones automáticas que bloquean cambios fuera de las reglas del diseño y del
            tamaño de archivo. El baseline de tamanos solo puede bajar.
          </p>
        </header>

        <section className="space-y-3 rounded-card border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">Qué bloquea cada gate</h2>
          <Table
            caption="Gates automáticos del frontend"
            aria-label="Gates automáticos del frontend"
          >
            <TableHeader>
              <TableRow>
                <TableHead>Gate</TableHead>
                <TableHead>Qué bloquea</TableHead>
                <TableHead>Comando</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CONTROLES.map((fila) => (
                <TableRow key={fila.gate}>
                  <TableCell className="font-medium">{fila.gate}</TableCell>
                  <TableCell>{fila.bloquea}</TableCell>
                  <TableCell className="font-mono text-xs">{fila.comando}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        <section className="space-y-3 rounded-card border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">Límites de tamaño (tamanos)</h2>
          <Callout tone="warning" title="El baseline solo baja">
            Si un archivo ya excede el límite, el gate exige no empeorar el conteo. La corrección es
            dividir o extraer, no subir el baseline.
          </Callout>
          <Table
            caption="Límites de líneas por tipo de archivo"
            aria-label="Límites de líneas por tipo de archivo"
          >
            <TableHeader>
              <TableRow>
                <TableHead>Ámbito</TableHead>
                <TableHead>Límite</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {LIMITES.map((fila) => (
                <TableRow key={fila.ambito}>
                  <TableCell>{fila.ambito}</TableCell>
                  <TableCell className="font-medium">{fila.limite}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        <section className="space-y-3 rounded-card border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">Violación y arreglo correcto</h2>
          <p className="text-sm text-muted-foreground">
            Ante un bloqueo de ui:check, compón con el design system y sus tokens. Ante tamanos,
            extrae subcomponentes o lógica a módulos pequeños.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Violacion />
            <Arreglo />
          </div>
        </section>
      </div>
    </main>
  );
}

const meta = {
  title: 'Guías y calidad/Gates de calidad',
  component: GatesGuia,
  tags: ['ai-generated'],
} satisfies Meta<typeof GatesGuia>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Guia: Story = {};
