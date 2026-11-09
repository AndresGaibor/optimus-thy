import type { Meta, StoryObj } from '@storybook/react';
import { PatientCard } from '../../index';

const meta = {
  title: 'Sistema de diseño/Moléculas/PatientCard',
  component: PatientCard,
  args: {
    pseudonym: 'Paciente demo 014',
    ageRange: '45–54 años',
    institution: 'Centro de Salud de Demostración',
    caseStatus: 'Revisión',
  },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof PatientCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CasoEnRevision: Story = {
  args: {
    pseudonym: 'Paciente demo 014',
    ageRange: '45–54 años',
    institution: 'Centro de Salud de Demostración',
    caseStatus: 'Revisión',
  },
};
export const CasoCompleto: Story = {
  args: {
    pseudonym: 'Paciente demo 027',
    ageRange: '55–64 años',
    institution: 'Unidad Clínica de Muestra',
    caseStatus: 'Completa',
  },
};
export const Playground: Story = {};
export const ContenidoLargo: Story = {
  args: {
    pseudonym:
      'PacienteDemoSinteticoConSeudonimoExtensoParaComprobarElAjusteDelEncabezadoEnUnAnchoReducidodemostracionsinteticadigitaldeejemplo',
    institution:
      'Institución de demostración con nombre extenso para comprobar el ajuste de líneas de una tarjeta sin usar datos reales ni identificadores personales de ninguna persona. La tarjeta presenta únicamente valores inventados para ilustrar la estructura de una ficha en diferentes anchos de pantalla y no representa un caso clínico real.',
  },
};
