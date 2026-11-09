import type { Meta, StoryObj } from '@storybook/react-vite';
import { Callout, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '..';

const BUILD = [
  {
    archivo: 'index-B0yKIH9V.js',
    tipo: 'JavaScript',
    crudo: '336,5 kB',
    gzip: '103,9 kB',
  },
  {
    archivo: 'index-CAfTJrhH.css',
    tipo: 'CSS',
    crudo: '57,4 kB',
    gzip: '10,4 kB',
  },
];

const MEDICION = [
  {
    paso: 'Build',
    comando: 'cd frontend && bun run build',
    queMide: 'Tamaño real de artefactos en frontend/dist/assets (crudo y gzip).',
  },
  {
    paso: 'Captura visual',
    comando: 'cd frontend && bun run capturar --todo',
    queMide: 'Capturas PNG de estados documentados (no es métrica de rendimiento).',
  },
  {
    paso: 'Lighthouse (manual)',
    comando: 'Ejecutar Lighthouse en el navegador sobre la laptop de demostración',
    queMide: 'Rendimiento percibido, accesibilidad y buenas prácticas en ese equipo.',
  },
];

const REGLAS = [
  'Imágenes con loading="lazy" cuando no son críticas para el primer pantallazo.',
  'Sin librerías nuevas por comodidad: reutiliza dependencias y componentes existentes.',
  'Animaciones solo con tokens de movimiento del sistema (duración/curva), nunca valores ad hoc.',
  'Sin cifras inventadas de producto: cualquier número reportado debe salir de una medición real del repo o del entorno.',
];

function RendimientoGuia() {
  return (
    <main className="min-h-screen bg-background p-6 text-foreground sm:p-8">
      <div className="mx-auto max-w-(--content-max-width) space-y-8">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            Guía de rendimiento
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Presupuesto y medición (HT-104)</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Presupuesto orientado a la laptop de la demostración. Las cifras aquí provienen del
            build actual del repositorio (frontend/dist/assets); no se inventan métricas de producto
            ni resultados de laboratorio.
          </p>
        </header>

        <section className="space-y-3 rounded-card border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">Tamaño actual del build</h2>
          <p className="text-sm text-muted-foreground">
            Lectura directa de frontend/dist/assets (artefactos generados). El total gzip observado
            es ~103,9 kB de JS y ~10,4 kB de CSS.
          </p>
          <Table
            caption="Tamaño actual del build por artefacto"
            aria-label="Tamaño actual del build por artefacto"
          >
            <TableHeader>
              <TableRow>
                <TableHead>Archivo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Tamaño crudo</TableHead>
                <TableHead>Gzip</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {BUILD.map((fila) => (
                <TableRow key={fila.archivo}>
                  <TableCell className="font-mono text-xs">{fila.archivo}</TableCell>
                  <TableCell>{fila.tipo}</TableCell>
                  <TableCell>{fila.crudo}</TableCell>
                  <TableCell>{fila.gzip}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        <section className="space-y-3 rounded-card border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">Cómo se mide</h2>
          <p className="text-sm text-muted-foreground">
            Pasos reproducibles. Lighthouse es manual y depende del equipo; sus puntajes no se fijan
            en esta guía.
          </p>
          <Table caption="Pasos para medir rendimiento" aria-label="Pasos para medir rendimiento">
            <TableHeader>
              <TableRow>
                <TableHead>Paso</TableHead>
                <TableHead>Comando / acción</TableHead>
                <TableHead>Qué mide</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MEDICION.map((fila) => (
                <TableRow key={fila.paso}>
                  <TableCell className="font-medium">{fila.paso}</TableCell>
                  <TableCell className="font-mono text-xs">{fila.comando}</TableCell>
                  <TableCell>{fila.queMide}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        <section className="space-y-3 rounded-card border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">Reglas de presupuesto</h2>
          <Callout tone="info" title="Sin métricas inventadas">
            Reporta solo números medidos en el repo o en la laptop de demostración. Si falta una
            medición, indícalo explícitamente en lugar de estimar.
          </Callout>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {REGLAS.map((regla) => (
              <li key={regla}>{regla}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

const meta = {
  title: 'Guías y calidad/Rendimiento',
  component: RendimientoGuia,
  tags: ['ai-generated'],
} satisfies Meta<typeof RendimientoGuia>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Presupuesto: Story = {};
