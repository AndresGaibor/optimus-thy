import type { Meta, StoryObj } from '@storybook/react-vite';
import { Callout, PageHeader } from '../../design-system';
import { FormularioRegistro } from './FormularioRegistro';

const meta = {
  title: 'Sistema de diseño/Plantillas/Formulario de registro',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;

const errores = {
  nombre: 'El nombre completo es obligatorio.',
  documento: 'El documento debe tener entre 6 y 12 caracteres.',
  motivo: 'Selecciona un motivo de consulta.',
};

export const Inicial: StoryObj<typeof meta> = {
  render: () => (
    <main className="mx-auto w-full max-w-(--content-max-width) space-y-6 p-6">
      <PageHeader
        title="Formulario de registro"
        description="Alta de un registro sintético con datos administrativos y clínicos."
      />
      <Callout title="Cuándo usar esta plantilla">
        Úsala para capturas de datos en dos secciones, con resumen de errores, acciones primaria y
        secundaria, y bloqueo de envío mientras se guarda.
      </Callout>
      <FormularioRegistro />
    </main>
  ),
};

export const ConErrores: StoryObj<typeof meta> = {
  render: () => (
    <main className="mx-auto w-full max-w-(--content-max-width) space-y-6 p-6">
      <PageHeader
        title="Formulario de registro"
        description="Alta de un registro sintético con datos administrativos y clínicos."
      />
      <Callout title="Cuándo usar esta plantilla">
        Úsala para capturas de datos en dos secciones, con resumen de errores, acciones primaria y
        secundaria, y bloqueo de envío mientras se guarda.
      </Callout>
      <FormularioRegistro errores={errores} />
    </main>
  ),
};

export const Guardando: StoryObj<typeof meta> = {
  render: () => (
    <main className="mx-auto w-full max-w-(--content-max-width) space-y-6 p-6">
      <PageHeader
        title="Formulario de registro"
        description="Alta de un registro sintético con datos administrativos y clínicos."
      />
      <Callout title="Cuándo usar esta plantilla">
        Úsala para capturas de datos en dos secciones, con resumen de errores, acciones primaria y
        secundaria, y bloqueo de envío mientras se guarda.
      </Callout>
      <FormularioRegistro guardando />
    </main>
  ),
};
