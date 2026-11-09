import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
import { Button, Callout, Field, Input, PageHeader, Select, Textarea } from '../index';

const meta = {
  title: 'Sistema de diseño/Patrones/Formularios',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Pagina({ descripcion, children }: { descripcion: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-(--content-max-width) space-y-6 p-6">
      <PageHeader title="Formularios" description={descripcion} />
      <Callout title="Cuándo no usarlo">
        Evita un formulario largo para una acción breve o reversible; usa una acción directa. No
        mezcles la captura de datos con decisiones automatizadas: la IA no diagnostica.
      </Callout>
      {children}
    </main>
  );
}

function AltaSimple() {
  return (
    <form className="max-w-2xl space-y-4" onSubmit={(event) => event.preventDefault()}>
      <Field label="Nombre completo" required hint="Escribe el nombre de demostración.">
        <Input name="nombre" autoComplete="name" placeholder="María López (dato sintético)" />
      </Field>
      <Field label="Correo institucional" required hint="Usa una dirección con formato de correo.">
        <Input name="correo" type="email" autoComplete="email" placeholder="maria@example.test" />
      </Field>
      <Field label="Tipo de registro" required>
        <Select name="tipo" defaultValue="">
          <option value="" disabled>
            Selecciona una opción
          </option>
          <option value="seguimiento">Seguimiento</option>
          <option value="consulta">Consulta</option>
        </Select>
      </Field>
      <Field label="Notas" hint="No incluyas datos reales en este ejemplo.">
        <Textarea name="notas" rows={3} placeholder="Información sintética" />
      </Field>
      <Button type="submit">Guardar ejemplo</Button>
    </form>
  );
}

function AltaPorSecciones() {
  return (
    <form className="max-w-2xl space-y-8" onSubmit={(event) => event.preventDefault()}>
      <section aria-labelledby="alta-identificacion" className="space-y-4">
        <h2 id="alta-identificacion" className="text-lg font-semibold text-foreground">
          Identificación
        </h2>
        <Field
          label="Código de muestra"
          required
          hint="Identificador sintético, por ejemplo DEMO-0142."
        >
          <Input name="codigo" placeholder="DEMO-0142" />
        </Field>
        <Field label="Correo de contacto" required>
          <Input name="correo" type="email" placeholder="contacto@example.test" />
        </Field>
      </section>
      <section aria-labelledby="alta-contexto" className="space-y-4">
        <h2 id="alta-contexto" className="text-lg font-semibold text-foreground">
          Contexto
        </h2>
        <Field label="Origen del registro" required>
          <Select name="origen" defaultValue="web">
            <option value="web">Portal de demostración</option>
            <option value="importado">Importación sintética</option>
          </Select>
        </Field>
        <Field
          label="Descripción"
          hint="La IA no diagnostica; registra información sin inferir conclusiones."
        >
          <Textarea name="descripcion" rows={4} placeholder="Describe el contexto de prueba" />
        </Field>
      </section>
      <Button type="submit">Guardar ejemplo</Button>
    </form>
  );
}

function AltaConErrores() {
  const [enviado, setEnviado] = useState(false);
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('correo-invalido');
  const errores = {
    nombre: enviado && !nombre.trim() ? 'Ingresa el nombre completo.' : undefined,
    correo: enviado && !correo.includes('@') ? 'Ingresa un correo válido.' : undefined,
  };
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
        <Callout title="Hay campos que requieren atención" role="alert">
          Corrige los errores indicados junto a cada campo antes de guardar.
        </Callout>
      ) : null}
      <Field label="Nombre completo" required error={errores.nombre}>
        <Input name="nombre" value={nombre} onChange={(event) => setNombre(event.target.value)} />
      </Field>
      <Field label="Correo institucional" required error={errores.correo}>
        <Input
          name="correo"
          type="email"
          value={correo}
          onChange={(event) => setCorreo(event.target.value)}
        />
      </Field>
      <Button type="submit">Validar y guardar</Button>
    </form>
  );
}

export const Simple: Story = {
  render: () => (
    <Pagina descripcion="Alta de datos sintéticos con etiquetas visibles, ayuda contextual y un orden de tabulación natural.">
      <Callout title="Regla de accesibilidad">
        Etiqueta cada control, explica la obligatoriedad con texto y conserva el orden visual al
        tabular. Los campos required de Field exponen su estado al control.
      </Callout>
      <AltaSimple />
    </Pagina>
  ),
};

export const ConSecciones: Story = {
  render: () => (
    <Pagina descripcion="Agrupa campos relacionados para orientar la lectura y completar una alta de varios pasos conceptuales.">
      <Callout title="Regla de accesibilidad">
        Usa encabezados semánticos para cada grupo; la secuencia de tabulación sigue el orden de
        lectura y nunca se comunica solo por color.
      </Callout>
      <AltaPorSecciones />
    </Pagina>
  ),
};

export const ConErrores: Story = {
  render: () => (
    <Pagina descripcion="Presenta errores accionables en el campo correspondiente y un resumen al enviar.">
      <Callout title="Regla de accesibilidad">
        Field asocia el mensaje y la ayuda al control, marca aria-invalid y muestra un icono y
        texto, no solo color.
      </Callout>
      <AltaConErrores />
    </Pagina>
  ),
};
