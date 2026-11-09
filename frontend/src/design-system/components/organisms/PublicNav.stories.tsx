import type { Meta, StoryObj } from '@storybook/react-vite';
import { Link } from 'react-router-dom';
import { Button } from '../atoms/Button';
import { PublicNav } from './PublicNav';

const meta = {
  title: 'Sistema de diseño/Organismos/PublicNav',
  component: PublicNav,
  args: {
    links: [
      { to: '/', label: 'Inicio' },
      { to: '/login', label: 'Acceso' },
    ],
    actions: (
      <>
        <Button variant="ghost" asChild>
          <Link to="/login">Iniciar sesión</Link>
        </Button>
      </>
    ),
  },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof PublicNav>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Predeterminada: Story = {};

export const EtiquetasAccesibles: Story = {
  args: {
    menuLabel: 'Abrir menú principal del sitio',
    closeMenuLabel: 'Cerrar menú principal del sitio',
    navLabel: 'Navegación pública principal de OPTIMUS-THY',
  },
};
