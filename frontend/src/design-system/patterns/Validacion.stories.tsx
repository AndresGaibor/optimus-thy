import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { useState, type ReactNode } from 'react';
import { Button, Callout, Field, Input, PageHeader } from '../index';

const meta = {
  title: 'Sistema de diseño/Patrones/Validación',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type Momento = 'enviar' | 'salir';

function FormularioValidado({ momento }: { momento: Momento }) {
  const [enviado, setEnviado] = useState(false);
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [visitados, setVisitados] = useState<string[]>([]);
  const seValida = (campo: string) =>
    momento === 'enviar' ? enviado : visitados.includes(campo) || enviado;
  const errores = {
    nombre: seValida('nombre') && !nombre.trim() ? 'Ingresa el nombre completo.' : undefined,
    correo:
      seValida('correo') && !/^\S+@\S+\.\S+$/.test(correo)
        ? 'Ingresa un correo válido.'
        : undefined,
  };
  const marcarVisitado = (campo: string) =>
    setVisitados((actuales) => (actuales.includes(campo) ? actuales : [...actuales, campo]));

  return (
    <form
      className="max-w-2xl space-y-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setEnviado(true);
      }}
    >
      {enviado && (errores.nombre || errores.correo) ? (
        <Callout title="No se pudo enviar el formulario" role="alert">
          Hay {Number(Boolean(errores.nombre)) + Number(Boolean(errores.correo))} campos por
          corregir. Revisa los mensajes asociados a cada campo.
        </Callout>
      ) : null}
      <Field label="Nombre completo" required error={errores.nombre}>
        <Input
          name="nombre"
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          onBlur={() => marcarVisitado('nombre')}
        />
      </Field>
      <Field label="Correo institucional" required error={errores.correo}>
        <Input
          name="correo"
          type="email"
          value={correo}
          onChange={(event) => setCorreo(event.target.value)}
          onBlur={() => marcarVisitado('correo')}
        />
      </Field>
      <Button type="submit">Enviar formulario</Button>
    </form>
  );
}

function Pagina({ descripcion, children }: { descripcion: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-(--content-max-width) space-y-6 p-6">
      <PageHeader title="Validación de formularios" description={descripcion} />
      <Callout title="Cuándo no usarlo">
        No interrumpas con errores antes de que la persona haya interactuado ni reemplaces la
        validación del servidor en datos sensibles.
      </Callout>
      <Callout title="Regla de accesibilidad">
        Muestra mensajes junto al campo, vincúlalos como descripción y marca aria-invalid; tras
        enviar, resume los errores y permite llegar a ellos con teclado.
      </Callout>
      {children}
    </main>
  );
}

export const ConErrores: Story = {
  render: () => (
    <Pagina descripcion="Valida al enviar para no interrumpir la escritura; los errores aparecen junto al campo y se resumen arriba.">
      <FormularioValidado momento="enviar" />
    </Pagina>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Enviar formulario' }));
    await expect(canvas.getByText('Ingresa el nombre completo.')).toBeInTheDocument();
    await expect(canvas.getByText('Ingresa un correo válido.')).toBeInTheDocument();
    await expect(canvas.getByRole('alert')).toBeInTheDocument();
    await expect(canvas.getByLabelText(/^Nombre completo/)).toHaveAttribute('aria-invalid', 'true');
    await expect(canvas.getByLabelText(/^Correo institucional/)).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  },
};

export const AlSalirDelCampo: Story = {
  render: () => (
    <Pagina descripcion="Valida al salir de cada campo después de la primera interacción para facilitar correcciones tempranas.">
      <FormularioValidado momento="salir" />
    </Pagina>
  ),
};
