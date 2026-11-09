import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity, LayoutDashboard, Users } from 'lucide-react';
import { SidebarLayout } from '../design-system/components/organisms/SidebarLayout';

function ShellGuia() {
  return (
    <main className="min-h-screen bg-background p-6 text-foreground sm:p-8">
      <div className="mx-auto max-w-(--content-max-width) space-y-8">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">Shell</p>
          <h1 className="text-3xl font-semibold tracking-tight">Chrome de la aplicación</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Las historias bajo <strong>Aplicación</strong> muestran la superficie de contenido sin
            el marco de la aplicación para aislar cada pantalla. El marco real incluye una barra
            lateral según el rol activo, permite cambiar el rol activo y cerrar sesión.
          </p>
        </header>

        <section className="space-y-3 rounded-card border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">Marco de la aplicación</h2>
          <p className="text-sm text-muted-foreground">
            Ejemplo aislado de <code>SidebarLayout</code> con tres ítems de navegación.
          </p>
          <div className="overflow-hidden rounded-card border border-border">
            <div className="h-[420px]">
              <SidebarLayout
                navItems={[
                  { to: '/demo/inicio', label: 'Inicio', icon: LayoutDashboard, end: true },
                  { to: '/demo/pacientes', label: 'Pacientes', icon: Users },
                  { to: '/demo/inferencia', label: 'Inferencia', icon: Activity },
                ]}
                navLabel="Navegación de demostración"
                sessionInfo={<span>Rol de demostración</span>}
                tone="medico"
                roleLabel="Médico"
              >
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Superficie de contenido</h3>
                  <p className="text-sm text-muted-foreground">
                    Aquí se renderiza el contenido de la pantalla dentro del marco lateral.
                  </p>
                </div>
              </SidebarLayout>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

const meta = {
  title: 'Aplicación/Shell y navegación',
  component: ShellGuia,
  parameters: { layout: 'fullscreen' },
  tags: ['ai-generated'],
} satisfies Meta<typeof ShellGuia>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Guia: Story = {};
