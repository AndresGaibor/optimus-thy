import type { Meta, StoryObj } from '@storybook/react-vite';
import { Callout, Card, CardContent, CardDescription, CardHeader, CardTitle } from '../index';

type Referencia = { archivo: string; alt: string; contexto: string };

const REFERENCIAS: Referencia[] = [
  {
    archivo: 'eco-nodulo-hipoecoico.png',
    alt: 'Ecografía tiroidea sintética con un nódulo hipoecoico de referencia, sin identificadores.',
    contexto: 'Ejemplo de ecografía para orientar composición y jerarquía visual del visor.',
  },
  {
    archivo: 'eco-doppler-color.png',
    alt: 'Ecografía Doppler color sintética de referencia, sin datos de paciente.',
    contexto: 'Referencia de imagen con señal de color para contraste y legibilidad de controles.',
  },
  {
    archivo: 'ficha-ecografia.png',
    alt: 'Ficha de ecografía de referencia con campos clínicos ficticios y sin identificadores.',
    contexto: 'Referencia de estructura de ficha para distribuir campos y estados de captura.',
  },
  {
    archivo: 'paaf-citologia.png',
    alt: 'Imagen de citología PAAF de referencia, anonimizada y sin metadatos visibles.',
    contexto: 'Referencia morfológica genérica para la galería documental del caso.',
  },
];

const CRITERIOS = [
  'Sin nombres de personas, códigos de historia clínica ni identificadores directos.',
  'Sin fechas exactas, ubicaciones precisas ni metadatos que permitan reidentificación.',
  'Uso solo como referencia visual de composición; no como dato clínico real ni base diagnóstica.',
  'Cualquier imagen incorporada debe revisarse y anonimizarse antes de publicarse en la guía.',
];

function ImagenesGuia() {
  return (
    <main className="min-h-screen bg-background p-6 text-foreground sm:p-8">
      <div className="mx-auto max-w-(--content-max-width) space-y-8">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            Investigación · Imágenes
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Galería de referencia anonimizada (HT-094)
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Miniaturas de referencia servidas desde /images (mockup anterior, staticDirs de
            Storybook). Se usan para orientar composición visual; no representan casos reales.
          </p>
        </header>

        <Callout tone="warning" title="Material sintético / de referencia">
          Estas imágenes son referencia anonimizada del mockup anterior. No contienen datos reales y
          no deben interpretarse como evidencia clínica ni diagnóstico.
        </Callout>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Miniaturas de referencia</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {REFERENCIAS.map((ref) => (
              <Card key={ref.archivo}>
                <CardHeader>
                  <CardTitle className="text-base">{ref.archivo}</CardTitle>
                  <CardDescription>{ref.contexto}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="overflow-hidden rounded-control border border-border bg-surface-subtle">
                    <img
                      src={`${import.meta.env.BASE_URL}images/${ref.archivo}`}
                      alt={ref.alt}
                      loading="lazy"
                      className="h-48 w-full object-contain"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{ref.alt}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-3 rounded-card border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">Criterios de anonimización</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {CRITERIOS.map((criterio) => (
              <li key={criterio}>{criterio}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

const meta = {
  title: 'Guías y calidad/Evidencias visuales/Imágenes anonimizadas',
  component: ImagenesGuia,
} satisfies Meta<typeof ImagenesGuia>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Galeria: Story = {};
