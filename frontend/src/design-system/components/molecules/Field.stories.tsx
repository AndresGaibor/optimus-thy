import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from '../atoms/Input';
import { Textarea } from '../atoms/Textarea';
import { Field } from './Field';

const meta = {
  title: 'Sistema de diseño/Moléculas/Field',
  component: Field,
  args: {
    label: 'Correo de demostración',
    children: <Input type="email" placeholder="nombre@example.test" />,
    hint: 'Dato sintético para mostrar el campo y su ayuda.',
  },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof Field>;

export default meta;

export const Predeterminado: StoryObj<typeof meta> = {};
export const ObligatorioConError: StoryObj<typeof meta> = {
  args: {
    label: 'Descripción sintética',
    children: <Textarea placeholder="Escribe una descripción de demostración" />,
    required: true,
    error: 'Este campo de demostración es obligatorio.',
  },
  render: (args) => {
    const fieldArgs = { ...args };
    delete fieldArgs.hint;
    return <Field {...fieldArgs} />;
  },
};
export const ConAyuda: StoryObj<typeof meta> = {
  args: {
    label: 'Código de muestra',
    children: <Input placeholder="DEMO-001" />,
    hint: 'Identificador ficticio, sin datos personales ni clínicos.',
  },
};
export const Playground: StoryObj<typeof meta> = {};
export const ContenidoLargo: StoryObj<typeof meta> = {
  args: {
    label:
      'Demostracionsinteticaparacomprobarqueunaetiquetalargapermanecelegiblejuntoalcontrolensituacionesdeespaciolimitadosintetico',
    hint: 'Esta ayuda de ejemplo muestra cómo se presenta una explicación extensa del dato solicitado. El texto es sintético y permite comprobar la asociación visual y accesible entre la etiqueta, el control y las instrucciones, incluso cuando las líneas se ajustan al ancho de la pantalla. La historia utiliza contenido inventado para revisar la lectura y la distribución del campo en distintos tamaños, sin atribuir información a una persona real.',
  },
};
