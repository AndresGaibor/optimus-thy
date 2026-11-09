import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import {
  Badge,
  ACTIVITY_TONES,
  INFERENCE_STATUS_TONES,
  RECORD_STATUS_TONES,
  getTiradsTone,
} from '../index';
import { TONE_ICONS } from '../lib/tone-icons';
import { ROLE_ICONS } from '../lib/role-icons';
import { TONE_CLASSES, type BadgeTone, type RoleKey } from '../tones';

const tonos: ReadonlyArray<{ tono: BadgeTone; etiqueta: string }> = [
  { tono: 'neutral', etiqueta: 'Neutro' },
  { tono: 'info', etiqueta: 'Información' },
  { tono: 'success', etiqueta: 'Correcto' },
  { tono: 'warning', etiqueta: 'Pendiente' },
  { tono: 'attention', etiqueta: 'Atención' },
  { tono: 'danger', etiqueta: 'Error' },
  { tono: 'ai', etiqueta: 'Asistencia IA' },
];

const roles: ReadonlyArray<{ rol: RoleKey; etiqueta: string; icono: string }> = [
  { rol: 'medico', etiqueta: 'Médico', icono: 'Stethoscope' },
  { rol: 'investigador', etiqueta: 'Investigador', icono: 'FlaskConical' },
  { rol: 'administrador', etiqueta: 'Administrador', icono: 'ShieldCheck' },
];
const toneIconNames: Record<BadgeTone, string> = {
  neutral: 'Info',
  info: 'Info',
  success: 'CircleCheck',
  warning: 'TriangleAlert',
  attention: 'TriangleAlert',
  danger: 'OctagonAlert',
  ai: 'Sparkles',
};

const meta = {
  title: 'Sistema de diseño/Primitivos/Tonos',
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'error' },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <main className="mx-auto w-full max-w-(--content-max-width) space-y-8 p-6 text-foreground">
      <header className="space-y-2">
        <h1 className="text-headline font-semibold">Tonos semánticos</h1>
        <p className="text-body text-muted-foreground">
          Los tonos combinan icono y etiqueta; el color nunca es el único indicador.
        </p>
      </header>

      <section aria-labelledby="tones-heading" className="space-y-4">
        <h2 id="tones-heading" className="text-title font-semibold">
          Tonos de Badge
        </h2>
        <div className="flex flex-wrap gap-3" role="group" aria-label="Tonos de Badge">
          {tonos.map(({ tono, etiqueta }) => {
            const Icon = TONE_ICONS[tono];
            return (
              <Badge key={tono} tone={tono}>
                <Icon aria-hidden="true" data-tone-icon={tono} />
                {etiqueta}
              </Badge>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="classes-heading" className="space-y-4">
        <h2 id="classes-heading" className="text-title font-semibold">
          Mapa `TONE_CLASSES`
        </h2>
        <div className="overflow-x-auto rounded-card border border-border">
          <table className="w-full min-w-[48rem] text-left text-small">
            <thead className="bg-surface-subtle text-muted-foreground">
              <tr>
                <th className="p-3">Tono</th>
                <th className="p-3">soft</th>
                <th className="p-3">surface</th>
                <th className="p-3">text</th>
                <th className="p-3">solid</th>
                <th className="p-3">marker</th>
                <th className="p-3">stroke</th>
                <th className="p-3">fill</th>
                <th className="p-3">areaFill</th>
              </tr>
            </thead>
            <tbody>
              {tonos.map(({ tono }) => {
                const classes = TONE_CLASSES[tono];
                return (
                  <tr key={tono} className="border-t border-border">
                    <th scope="row" className="p-3">
                      <Badge tone={tono}>{tono}</Badge>
                    </th>
                    {Object.values(classes).map((value, index) => (
                      <td key={`${tono}-${index}`} className="p-3 font-mono text-caption">
                        <code className="rounded-control px-1">{value}</code>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="icons-heading" className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <h2 id="icons-heading" className="text-title font-semibold">
            `TONE_ICONS`
          </h2>
          <ul className="space-y-2">
            {tonos.map(({ tono }) => {
              const Icon = TONE_ICONS[tono];
              return (
                <li key={tono} className="flex items-center gap-2">
                  <Icon aria-hidden="true" className="size-4" />
                  {tono}: {toneIconNames[tono]}
                </li>
              );
            })}
          </ul>
          <p className="text-small text-muted-foreground">
            Iconos del mapa: Info, CircleCheck, TriangleAlert, OctagonAlert y Sparkles.
          </p>
        </div>
        <div className="space-y-3">
          <h2 className="text-title font-semibold">`ROLE_ICONS`</h2>
          <ul className="space-y-2">
            {roles.map(({ rol, etiqueta, icono }) => {
              const Icon = ROLE_ICONS[rol];
              return (
                <li key={rol} className="flex items-center gap-2">
                  <Icon aria-hidden="true" className="size-4" />
                  {etiqueta}: {icono}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section aria-labelledby="status-heading" className="space-y-4">
        <h2 id="status-heading" className="text-title font-semibold">
          Mapas de estado a tono
        </h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <Mapeo titulo="`RECORD_STATUS_TONES`" mapa={RECORD_STATUS_TONES} />
          <Mapeo titulo="`INFERENCE_STATUS_TONES`" mapa={INFERENCE_STATUS_TONES} />
          <Mapeo titulo="`ACTIVITY_TONES`" mapa={ACTIVITY_TONES} />
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Tonos de clasificación TI-RADS">
          {[1, 2, 3, 4, 5].map((valor) => (
            <Badge key={valor} tone={getTiradsTone(valor)}>
              TI-RADS {valor}: {getTiradsTone(valor)}
            </Badge>
          ))}
        </div>
      </section>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const tonosBadge = canvasElement.querySelector<HTMLElement>('[aria-label="Tonos de Badge"]');
    if (!tonosBadge) throw new Error('No se encontró el grupo de tonos de Badge');
    const listaTonos = within(tonosBadge);
    for (const { tono, etiqueta } of tonos) {
      await expect(listaTonos.getByText(etiqueta)).toBeVisible();
      await expect(tonosBadge.querySelector(`[data-tone-icon="${tono}"]`)).toBeVisible();
    }
  },
};

function Mapeo<T extends Record<keyof T, BadgeTone>>({
  titulo,
  mapa,
}: {
  titulo: string;
  mapa: T;
}) {
  return (
    <div className="overflow-x-auto rounded-card border border-border">
      <table className="w-full text-left text-small">
        <caption className="p-3 text-left font-semibold">{titulo}</caption>
        <thead className="bg-surface-subtle text-muted-foreground">
          <tr>
            <th className="p-3">Estado</th>
            <th className="p-3">Tono</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(mapa).map((estado) => {
            const tono = mapa[estado as keyof T];
            return (
              <tr key={estado} className="border-t border-border">
                <th scope="row" className="p-3 font-medium">
                  {estado}
                </th>
                <td className="p-3">
                  <Badge tone={tono}>{tono}</Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
