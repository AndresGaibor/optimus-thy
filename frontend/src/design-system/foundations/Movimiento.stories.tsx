import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { Button } from '../components/atoms/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/atoms/Card';
import { Dialog, DialogClose } from '../components/organisms/Dialog';
import { Toast } from '../components/molecules/Toast';
import { cn } from '../lib/cn';

const DURACIONES = [
  {
    etiqueta: 'Rápida',
    token: '--duration-fast',
    clase: 'duration-fast',
    nota: 'Microinteracciones: foco, cambios de estado pequeños.',
  },
  {
    etiqueta: 'Base',
    token: '--duration-base',
    clase: 'duration-base',
    nota: 'Transiciones habituales: avisos, paneles ligeros.',
  },
  {
    etiqueta: 'Lenta',
    token: '--duration-slow',
    clase: 'duration-slow',
    nota: 'Cambios más notorios; úsala solo cuando aporte claridad.',
  },
] as const;

function DemoDuracion({ activa }: { activa: boolean }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {DURACIONES.map((item) => (
        <Card
          key={item.token}
          className={cn(
            'transition-[opacity,transform] ease-standard',
            item.clase,
            activa ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-60',
          )}
        >
          <CardHeader>
            <CardTitle as="h3" className="text-base">
              {item.etiqueta}
            </CardTitle>
            <CardDescription>
              <code className="text-xs">{item.token}</code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{item.nota}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DuracionesHistoria() {
  const [activa, setActiva] = useState(true);
  return (
    <section className="space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Duraciones</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Las duraciones vienen de tokens y comparten la curva estándar. Repite la transición para
          comparar <code>fast</code>, <code>base</code> y <code>slow</code> sobre el mismo
          componente real (<code>Card</code>).
        </p>
      </header>
      <Button type="button" variant="outline" onClick={() => setActiva((valor) => !valor)}>
        {activa ? 'Atenuar tarjetas' : 'Repetir transición'}
      </Button>
      <DemoDuracion activa={activa} />
    </section>
  );
}

const CURVAS = [
  {
    etiqueta: 'Estándar',
    token: '--ease-standard',
    clase: 'ease-standard',
    nota: 'Movimiento neutro para la mayoría de transiciones.',
  },
  {
    etiqueta: 'Enfatizada',
    token: '--ease-emphasized',
    clase: 'ease-emphasized',
    nota: 'Entrada/salida con más intención, como paneles de incorporación.',
  },
] as const;

function DemoCurva({ activa }: { activa: boolean }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {CURVAS.map((item) => (
        <div key={item.token} className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            {item.etiqueta} <code className="font-normal text-muted-foreground">{item.token}</code>
          </p>
          <Card
            className={cn(
              'transition-[opacity,transform] duration-slow',
              item.clase,
              activa ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0',
            )}
          >
            <CardHeader>
              <CardTitle as="h3" className="text-base">
                Entrada de panel
              </CardTitle>
              <CardDescription>{item.nota}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Mismo desplazamiento y duración lenta; cambia solo la curva.
              </p>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}

function CurvasHistoria() {
  const [activa, setActiva] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setActiva(true), 30);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <section className="space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Curvas</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Compara <code>ease-standard</code> y <code>ease-emphasized</code> en el mismo movimiento
          de entrada, útil para onboarding o paneles que aparecen.
        </p>
      </header>
      <Button type="button" variant="outline" onClick={() => setActiva((valor) => !valor)}>
        {activa ? 'Reiniciar entrada' : 'Mostrar entrada'}
      </Button>
      <DemoCurva activa={activa} />
    </section>
  );
}

function DialogoHistoria() {
  const [abierto, setAbierto] = useState(false);
  return (
    <section className="space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Diálogo</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          El componente <code>Dialog</code> gestiona foco y cierre. El movimiento debe usar la
          duración de token: anima <strong>opacidad</strong> y una <strong>escala mínima</strong>{' '}
          del contenedor; no animes la posición del contenido ni tablas dentro del diálogo.
        </p>
      </header>
      <div className="flex flex-wrap items-center gap-3">
        <Dialog
          open={abierto}
          onOpenChange={setAbierto}
          trigger={<Button variant="outline">Abrir diálogo</Button>}
          title="Movimiento de diálogo"
          description="Demostración de apertura y cierre con foco gestionado."
          footer={
            <DialogClose asChild>
              <Button>Cerrar</Button>
            </DialogClose>
          }
        >
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Al abrir y cerrar, el foco vuelve al control disparador. Esta demostración usa el{' '}
              <code>Dialog</code> real del sistema de diseño.
            </p>
            <p>
              Qué animar: opacidad + escala mínima del panel. Qué no animar: desplazamiento del
              contenido, filas de tabla o datos clínicos.
            </p>
          </div>
        </Dialog>
        <Button type="button" variant="secondary" onClick={() => setAbierto(true)}>
          Abrir por estado
        </Button>
      </div>
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          La duración efectiva respeta <code>prefers-reduced-motion</code> mediante tokens globales.
        </CardContent>
      </Card>
    </section>
  );
}

function AvisoHistoria() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setVisible(true), 40);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <section className="space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Aviso</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          El <code>Toast</code> entra y sale con la duración base. El componente es visual; quien lo
          usa controla montaje, desmontaje y temporizadores.
        </p>
      </header>
      <Button type="button" variant="outline" onClick={() => setVisible((valor) => !valor)}>
        {visible ? 'Ocultar aviso' : 'Mostrar aviso'}
      </Button>
      <div className="min-h-28">
        <div
          className={cn(
            'transition-[opacity,transform] duration-base ease-standard',
            visible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0',
          )}
        >
          <Toast
            tone="info"
            title="Aviso de demostración"
            description="Entrada y salida con --duration-base y --ease-standard."
            onDismiss={() => setVisible(false)}
          />
        </div>
      </div>
    </section>
  );
}

function ReducidoHistoria() {
  return (
    <section className="space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Movimiento reducido</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Con <code>prefers-reduced-motion: reduce</code>, los tokens de duración se neutralizan y
          no debe haber movimiento decorativo. Usa <code>motion-safe:</code> para animaciones
          opcionales y <code>motion-reduce:</code> para estados estáticos equivalentes.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle as="h2">Regla global</CardTitle>
          <CardDescription>
            Definida en <code>frontend/src/styles/tokens.css</code> dentro de{' '}
            <code>@media (prefers-reduced-motion: reduce)</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <code>--duration-fast/base/slow</code> pasan a un valor mínimo, las curvas pasan a{' '}
            <code>linear</code> y las transiciones/animaciones se reducen.
          </p>
          <p>
            El contenido debe seguir siendo comprensible sin movimiento: cambios de estado visibles
            por texto, iconografía o contraste, nunca solo por animación.
          </p>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="motion-safe:transition-transform motion-safe:duration-slow motion-safe:ease-emphasized motion-safe:hover:-translate-y-1 motion-reduce:transition-none">
          <CardHeader>
            <CardTitle as="h3" className="text-base">
              Demostración con variantes
            </CardTitle>
            <CardDescription>
              Usa <code>motion-safe</code> y <code>motion-reduce</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              En movimiento normal, al pasar el puntero la tarjeta se eleva suavemente. Con
              movimiento reducido, no hay desplazamiento: el estado sigue siendo legible.
            </p>
          </CardContent>
        </Card>
        <Card className="border-border-subtle bg-surface-subtle">
          <CardHeader>
            <CardTitle as="h3" className="text-base">
              Comprobación manual
            </CardTitle>
            <CardDescription>Activa movimiento reducido en el sistema operativo.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Las demostraciones de duraciones, curvas, diálogo y aviso no deben desplazarse ni
              animarse cuando el medio solicita reducción.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

const meta = {
  title: 'Sistema de diseño/Fundamentos/Movimiento y animaciones',
  parameters: {
    docs: {
      description: {
        component: `
| Token | Valor |
|---|---|
| \`--duration-fast\` | \`150ms\` |
| \`--duration-base\` | \`200ms\` |
| \`--duration-slow\` | \`300ms\` |
| \`--motion-ease-standard\` | \`cubic-bezier(0.4, 0, 0.2, 1)\` |
| \`--motion-ease-emphasized\` | \`cubic-bezier(0.2, 0, 0, 1)\` |
| Movimiento reducido | \`0.01ms\` / \`linear\` |
`,
      },
    },
  },
  tags: ['ai-generated'],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Duraciones: Story = { render: () => <DuracionesHistoria /> };
export const Curvas: Story = { render: () => <CurvasHistoria /> };
export const Dialogo: Story = { render: () => <DialogoHistoria /> };
export const Aviso: Story = { render: () => <AvisoHistoria /> };
export const Reducido: Story = { render: () => <ReducidoHistoria /> };
