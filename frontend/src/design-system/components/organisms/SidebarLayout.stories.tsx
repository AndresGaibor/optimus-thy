import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity, FileText, Home } from 'lucide-react';
import { fn } from 'storybook/test';
import { Button } from '../atoms/Button';
import { Callout } from '../molecules/Callout';
import { PageHeader } from '../molecules/PageHeader';
import { RoleBadge } from '../molecules/RoleBadge';
import { SidebarLayout, type SidebarLayoutProps } from './SidebarLayout';

function SidebarLayoutStory(props: SidebarLayoutProps) {
  return <SidebarLayout {...props} />;
}

const meta = {
  title: 'Sistema de diseño/Organismos/SidebarLayout',
  component: SidebarLayout,
  args: {
    navItems: [
      { to: '/', label: 'Inicio', icon: Home, end: true },
      { to: '/registros', label: 'Registros', icon: FileText },
      { to: '/actividad', label: 'Actividad', icon: Activity },
    ],
    navLabel: 'Navegación de demostración',
    sessionInfo: <RoleBadge role="medico" />,
    sessionActions: (
      <Button variant="outline" className="w-full" onClick={fn()}>
        Cerrar sesión
      </Button>
    ),
    children: (
      <div className="space-y-6">
        <PageHeader
          title="Inicio"
          description="Vista de demostración del marco de la aplicación."
        />
      </div>
    ),
  },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof SidebarLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Escritorio: Story = {
  render: (args) => <SidebarLayoutStory {...args} />,
  args: {
    children: (
      <div className="space-y-6">
        <PageHeader
          title="Registros sintéticos"
          description="Contenido desplazable dentro del marco."
        />
        {Array.from({ length: 5 }, (_, index) => (
          <Callout key={index} tone="neutral" title={`Sección ${index + 1}`}>
            Elemento de ejemplo para comprobar el flujo de navegación.
          </Callout>
        ))}
      </div>
    ),
  },
};
export const ContenidoLargo: Story = {
  render: (args) => <SidebarLayoutStory {...args} />,
  args: {
    children: (
      <div className="space-y-6">
        <PageHeader
          title="Registros sintéticos extensos"
          description="Contenido desplazable más largo dentro del marco."
        />
        {Array.from({ length: 10 }, (_, index) => (
          <Callout key={index} tone="neutral" title={`Sección extendida ${index + 1}`}>
            Elemento de ejemplo adicional para comprobar el flujo de navegación con más altura.
          </Callout>
        ))}
      </div>
    ),
  },
};
export const Playground: Story = {};
