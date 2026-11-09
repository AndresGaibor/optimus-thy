import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from 'react';
import {
  Button,
  Callout,
  Dialog,
  DialogClose,
  Input,
  Label,
  StatusBadge,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TiradsBadge,
} from '..';

function FilaPar({ par, regla, uso }: { par: string; regla: string; uso: string }) {
  return (
    <TableRow>
      <TableCell className="font-medium">{par}</TableCell>
      <TableCell>{regla}</TableCell>
      <TableCell>{uso}</TableCell>
    </TableRow>
  );
}

function AccesibilidadGuia() {
  const [activo, setActivo] = useState(false);
  const nombreId = useId();
  const motivoId = useId();

  return (
    <main className="min-h-screen bg-background p-6 text-foreground sm:p-8">
      <div className="mx-auto max-w-(--content-max-width) space-y-8">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">Accesibilidad</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            WCAG 2.2 AA aplicada al producto
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Guía con componentes reales. Verifica en revisión: foco visible, teclado, contraste,
            significado sin color y respeto a preferencias de movimiento.
          </p>
        </header>

        <section className="space-y-3 rounded-card border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">Foco visible</h2>
          <p className="text-sm text-muted-foreground">
            Usa Tab para recorrer estos controles. Cada uno debe mostrar anillo de foco visible con
            el token de realce, sin depender solo del puntero.
          </p>
          <div className="flex flex-wrap items-end gap-4 rounded-card border border-border bg-surface-subtle p-4">
            <Button>Acción principal</Button>
            <div className="w-56 space-y-1">
              <Label htmlFor={nombreId}>Nombre de referencia</Label>
              <Input id={nombreId} defaultValue="Control con foco" />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <Switch
                aria-label="Activar aviso de demostración"
                checked={activo}
                onCheckedChange={setActivo}
              />
              <span className="text-sm text-muted-foreground">
                Interruptor {activo ? 'activado' : 'desactivado'}
              </span>
            </div>
          </div>
        </section>

        <section className="space-y-3 rounded-card border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">Orden de tabulación en diálogo</h2>
          <p className="text-sm text-muted-foreground">
            Al abrir, el foco entra al diálogo; Tab recorre campos y acciones en orden lógico;
            Escape cierra y devuelve el foco al disparador.
          </p>
          <Dialog
            trigger={<Button variant="outline">Abrir diálogo de revisión</Button>}
            title="Revisar dato sintético"
            description="Ejemplo de orden de tabulación: campo, confirmar y cancelar."
            footer={
              <>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button>Confirmar</Button>
                </DialogClose>
              </>
            }
          >
            <div className="space-y-2">
              <Label htmlFor={motivoId}>Motivo de revisión</Label>
              <Input id={motivoId} defaultValue="Dato sintético para verificación" />
            </div>
          </Dialog>
        </section>

        <section className="space-y-3 rounded-card border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">Navegación con teclado en pestañas</h2>
          <p className="text-sm text-muted-foreground">
            Las pestañas usan el primitivo con teclado: flechas mueven el foco entre pestañas,
            Inicio/Fin saltan al extremo, y Tab entra al contenido activo.
          </p>
          <Tabs defaultValue="resumen">
            <TabsList aria-label="Secciones de accesibilidad">
              <TabsTrigger value="resumen">Resumen</TabsTrigger>
              <TabsTrigger value="teclado">Teclado</TabsTrigger>
              <TabsTrigger value="contraste">Contraste</TabsTrigger>
            </TabsList>
            <TabsContent
              value="resumen"
              className="rounded-card border border-border bg-surface-subtle p-4 text-sm text-muted-foreground"
            >
              La revisión cubre foco, orden, nombres accesibles y contraste.
            </TabsContent>
            <TabsContent
              value="teclado"
              className="rounded-card border border-border bg-surface-subtle p-4 text-sm text-muted-foreground"
            >
              Todo control interactivo debe ser operable sin ratón.
            </TabsContent>
            <TabsContent
              value="contraste"
              className="rounded-card border border-border bg-surface-subtle p-4 text-sm text-muted-foreground"
            >
              Los pares texto/fondo deben cumplir la regla AA correspondiente.
            </TabsContent>
          </Tabs>
        </section>

        <section className="space-y-3 rounded-card border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">Contraste de pares texto/fondo</h2>
          <p className="text-sm text-muted-foreground">
            Pares definidos por tokens semánticos. Texto normal: 4.5:1; texto grande o componentes
            gráficos de interfaz: 3:1.
          </p>
          <Table caption="Pares de contraste con regla WCAG 2.2 AA">
            <TableHeader>
              <TableRow>
                <TableHead>Par (token de texto / fondo)</TableHead>
                <TableHead>Regla</TableHead>
                <TableHead>Uso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <FilaPar
                par="foreground / background"
                regla="4.5:1"
                uso="Texto principal sobre fondo base."
              />
              <FilaPar
                par="foreground / surface"
                regla="4.5:1"
                uso="Texto principal sobre tarjetas."
              />
              <FilaPar
                par="muted-foreground / surface"
                regla="4.5:1"
                uso="Texto secundario legible."
              />
              <FilaPar
                par="primary-foreground / primary"
                regla="4.5:1"
                uso="Botón y énfasis principal."
              />
              <FilaPar
                par="danger-foreground / danger"
                regla="4.5:1"
                uso="Avisos y acciones destructivas."
              />
              <FilaPar par="success-foreground / success" regla="4.5:1" uso="Estados de éxito." />
              <FilaPar
                par="ring / background o surface"
                regla="3:1"
                uso="Indicador de foco visible."
              />
              <FilaPar
                par="border / surface"
                regla="3:1"
                uso="Borde de controles y contenedores."
              />
            </TableBody>
          </Table>
        </section>

        <section className="space-y-3 rounded-card border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">Estados con texto además de color</h2>
          <p className="text-sm text-muted-foreground">
            El color refuerza; el significado se expresa con etiqueta textual. «Normal = sin nódulo
            detectado»; «Pendiente» mantiene significado de advertencia sin depender del tono.
          </p>
          <div className="space-y-4 rounded-card border border-border bg-surface-subtle p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">Registro:</span>
              <StatusBadge kind="record" status="Completa" />
              <StatusBadge kind="record" status="Pendiente" />
              <StatusBadge kind="record" status="Revisión" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">TI-RADS:</span>
              <TiradsBadge value="2" />
              <TiradsBadge value="4" />
              <TiradsBadge value="5" />
            </div>
          </div>
        </section>

        <section className="space-y-3 rounded-card border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">Movimiento reducido</h2>
          <p className="text-sm text-muted-foreground">
            Respeta{' '}
            <code className="rounded bg-surface-subtle px-1 py-0.5 text-xs">
              prefers-reduced-motion
            </code>
            . Las transiciones no deben ser la única forma de comunicar cambio. Consulta Sistema de
            diseño/Fundamentos/Movimiento y animaciones para duraciones, curvas y ejemplos.
          </p>
          <Callout tone="info" title="Referencia">
            Ver <strong>Sistema de diseño/Fundamentos/Movimiento y animaciones</strong> en el
            catálogo para el comportamiento con movimiento reducido.
          </Callout>
        </section>

        <section className="space-y-3 rounded-card border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">Lo que no se acepta en revisión</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Controles sin nombre accesible, sin foco visible o inoperables con teclado.</li>
            <li>Estado comunicado solo por color, sin texto, icono o patrón equivalente.</li>
            <li>Contraste insuficiente en texto, iconografía informativa o indicador de foco.</li>
            <li>Orden de tabulación ilógico, trampas de foco o diálogo que no devuelve el foco.</li>
            <li>
              Movimiento obligatorio para comprender el estado; sin alternativa con movimiento
              reducido.
            </li>
            <li>
              Etiquetas ambiguas, microcopias que culpan a la persona o mensajes sin acción clara.
            </li>
            <li>Afirmar diagnóstico automático: la IA no diagnostica; el criterio es clínico.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}

const meta = {
  title: 'Guías y calidad/Accesibilidad',
  component: AccesibilidadGuia,
  tags: ['ai-generated'],
} satisfies Meta<typeof AccesibilidadGuia>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Guia: Story = {};
