import type { Meta, StoryObj } from '@storybook/react-vite';
import type { SidebarNavItem } from '..';
import {
  Callout,
  SidebarLayout,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '..';

const NAV_ITEMS: SidebarNavItem[] = [
  { label: 'Resumen', to: '#resumen' },
  { label: 'Registros', to: '#registros' },
  { label: 'Resultados', to: '#resultados' },
  { label: 'Configuración', to: '#configuracion' },
];

function AdaptableGuia() {
  return (
    <main className="min-h-screen bg-background p-6 text-foreground sm:p-8">
      <div className="mx-auto max-w-(--content-max-width) space-y-8">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            Diseño adaptable
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Qué se adapta y qué no</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            El producto clínico se diseña para escritorio. Las tablas densas conservan legibilidad
            con desplazamiento horizontal; no se comprime información crítica.
          </p>
        </header>

        <section className="space-y-3 rounded-card border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">Mesa de anchos</h2>
          <p className="text-sm text-muted-foreground">
            Anchos de referencia para revisión. El contenido principal mantiene jerarquía y
            controles alcanzables.
          </p>
          <Table caption="Anchos de referencia y comportamiento esperado">
            <TableHeader>
              <TableRow>
                <TableHead>Ancho</TableHead>
                <TableHead>Contexto</TableHead>
                <TableHead>Comportamiento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">1366×768</TableCell>
                <TableCell>Portátil clínico común.</TableCell>
                <TableCell>
                  Priorizar contenido principal; tablas densas con scroll horizontal; controles sin
                  solaparse.
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">1440×900</TableCell>
                <TableCell>Escritorio/portátil amplio.</TableCell>
                <TableCell>
                  Más espacio para filtros y columnas; se conserva la misma jerarquía y lectura.
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">1920×1080</TableCell>
                <TableCell>Monitor de escritorio.</TableCell>
                <TableCell>
                  El ancho de contenido se contiene; se evita líneas excesivamente largas y espacios
                  vacíos sin función.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </section>

        <section className="space-y-3 rounded-card border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">Tablas densas: scroll horizontal conservado</h2>
          <p className="text-sm text-muted-foreground">
            Las columnas no se colapsan hasta perder significado. La tabla mantiene desplazamiento
            horizontal dentro de su región.
          </p>
          <Table caption="Ejemplo sintético de tabla densa con desplazamiento horizontal">
            <TableHeader>
              <TableRow>
                <TableHead>Registro</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>TI-RADS</TableHead>
                <TableHead>Bethesda</TableHead>
                <TableHead>Tamaño</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Observación clínica</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">REG-0142</TableCell>
                <TableCell>2026-10-12</TableCell>
                <TableCell>TR3</TableCell>
                <TableCell>II</TableCell>
                <TableCell>12 mm</TableCell>
                <TableCell>Lóbulo derecho, tercio medio</TableCell>
                <TableCell>Revisión</TableCell>
                <TableCell>
                  Dato sintético para verificar legibilidad y scroll horizontal.
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">REG-0143</TableCell>
                <TableCell>2026-10-13</TableCell>
                <TableCell>TR4</TableCell>
                <TableCell>IV</TableCell>
                <TableCell>18 mm</TableCell>
                <TableCell>Istmo, borde anterior</TableCell>
                <TableCell>Pendiente</TableCell>
                <TableCell>Dato sintético; no usar para decisiones clínicas reales.</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </section>

        <section className="space-y-3 rounded-card border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">SidebarLayout en ancho reducido</h2>
          <p className="text-sm text-muted-foreground">
            En ancho reducido, la navegación principal pasa al control de menú; el contenido sigue
            siendo el foco. Este ejemplo usa{' '}
            <code className="rounded bg-surface-subtle px-1 py-0.5 text-xs">SidebarLayout</code>{' '}
            real.
          </p>
          <div className="overflow-hidden rounded-card border border-border">
            <SidebarLayout navItems={NAV_ITEMS} navLabel="Navegación de ejemplo" roleLabel="Médico">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Contenido principal</h3>
                <p className="text-sm text-muted-foreground">
                  El área principal conserva prioridad. La barra lateral no compite con tareas de
                  revisión en anchos acotados.
                </p>
                <div className="rounded-card border border-border bg-surface-subtle p-4 text-sm text-muted-foreground">
                  Bloque sintético de contenido para observar el comportamiento del layout.
                </div>
              </div>
            </SidebarLayout>
          </div>
        </section>

        <section className="space-y-3 rounded-card border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">Límite explícito</h2>
          <Callout tone="warning" title="Sin variante móvil para el ERP clínico">
            El ERP clínico no tiene variante móvil. Los flujos de revisión, carga, validación y
            gestión requieren escritorio. El uso en móvil pertenece a pantallas públicas, no al ERP
            clínico interno.
          </Callout>
        </section>
      </div>
    </main>
  );
}

const meta = {
  title: 'Guías y calidad/Diseño adaptable',
  component: AdaptableGuia,
  tags: ['ai-generated'],
} satisfies Meta<typeof AdaptableGuia>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Anchos: Story = {};
