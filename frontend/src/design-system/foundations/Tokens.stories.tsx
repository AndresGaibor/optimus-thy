/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActivityTypeBadge } from '../components/molecules/ActivityTypeBadge';
import { RoleBadge } from '../components/molecules/RoleBadge';
import { StatusBadge } from '../components/molecules/StatusBadge';

const semanticTokens = [
  ['Fondo', '--background'],
  ['Superficie', '--surface'],
  ['Superficie sutil', '--surface-subtle'],
  ['Texto', '--foreground'],
  ['Texto secundario', '--muted-foreground'],
  ['Borde', '--border'],
  ['Marca', '--brand'],
  ['Información', '--info'],
  ['Éxito', '--success'],
  ['Advertencia', '--warning'],
  ['Atención', '--attention'],
  ['Peligro', '--danger'],
  ['IA', '--ai'],
] as const;

function TokenSwatches() {
  return (
    <section className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Tokens semánticos</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Usa roles de color, no valores de paleta en componentes. El selector Claro/Oscuro de la
          barra de herramientas aplica el mismo conjunto de tokens a ambos temas.
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {semanticTokens.map(([label, variable]) => (
          <article
            key={variable}
            className="flex min-h-24 items-center justify-between gap-4 rounded-card border border-border bg-surface p-4"
          >
            <div>
              <h2 className="font-medium">{label}</h2>
              <code className="text-xs text-muted-foreground">{variable}</code>
            </div>
            <span
              aria-hidden="true"
              className="size-10 shrink-0 rounded-control border border-border"
              style={{ backgroundColor: `var(${variable})` }}
            />
          </article>
        ))}
      </div>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Tono por significado</h2>
        <div className="flex flex-wrap gap-2">
          <StatusBadge kind="record" status="Pendiente" />
          <StatusBadge kind="inference" status="En cola" />
          <StatusBadge kind="dataset-request" status="aprobado" />
          <StatusBadge kind="user" status="Activo" />
          <ActivityTypeBadge type="inferencia" />
        </div>
        <p className="text-sm text-muted-foreground">
          El estado siempre combina texto e iconografía; el color nunca es la única señal.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Tonos de rol</h2>
        <div className="flex flex-wrap gap-2">
          <RoleBadge role="medico" />
          <RoleBadge role="investigador" />
          <RoleBadge role="administrador" />
        </div>
      </section>
    </section>
  );
}

const meta = {
  title: 'Sistema de diseño/Fundamentos/Tokens semánticos',
  tags: ['ai-generated'],
};

export default meta;

export const Claro: any = (args: any) => <TokenSwatches {...args} />;
export const Oscuro: any = (args: any) => <TokenSwatches {...args} />;
Oscuro.decorators = [
  (Story: any) => (
    <div className="dark min-h-screen bg-background text-foreground">
      <Story />
    </div>
  ),
];
