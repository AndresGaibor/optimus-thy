import type { Meta } from '@storybook/react';
import {
  ActivityTypeBadge,
  AiResultCard,
  Badge,
  Button,
  Callout,
  ConfidenceBadge,
  Input,
  RoleBadge,
  Select,
  StatusBadge,
  SupportNotice,
  TiradsBadge,
  Toast,
} from '../index';

function TemasEnOscuroGuia() {
  return (
    <div className="dark min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Temas en oscuro</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Guía sintética para revisar contraste y legibilidad de componentes en tema oscuro. No
            representa personas, casos clínicos ni datos reales.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Átomos</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Badge>Demostración sintética</Badge>
            <Button>Guardar cambios</Button>
            <Input
              aria-label="Campo de texto de demostración"
              className="max-w-xs"
              placeholder="Escribe aquí"
            />
            <Select
              aria-label="Opción seleccionada de demostración"
              className="max-w-xs"
              defaultValue="primera"
            >
              <option value="primera">Primera opción</option>
              <option value="segunda">Segunda opción</option>
            </Select>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Moléculas</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <Callout title="Información de demostración">
              El contenido de esta historia es sintético y solo ilustra el componente.
            </Callout>
            <Toast
              description="Mensaje sintético; no representa una acción real."
              title="Notificación de demostración"
            />
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge kind="record" status="Completa" />
              <RoleBadge role="medico" />
              <TiradsBadge value={3} />
              <ConfidenceBadge label="Confianza de demostración" tone="info" value={82.4} />
              <ActivityTypeBadge type="lectura" />
            </div>
            <AiResultCard
              classification="normal"
              date="30 oct 2026"
              dateTime="2026-10-30"
              modelVersion="modelo-demo-1.2"
              probability={0.94}
            />
            <SupportNotice context="inferencia" />
          </div>
        </section>
      </div>
    </div>
  );
}

const meta = {
  title: 'Sistema de diseño/Fundamentos/Temas en oscuro',
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
  render: () => <TemasEnOscuroGuia />,
} satisfies Meta;

export default meta;

export const Guia = {};
