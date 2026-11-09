import { Button } from '../components/atoms/Button';
import { Card, CardContent } from '../components/atoms/Card';
import { Input } from '../components/atoms/Input';
import { Select } from '../components/atoms/Select';
import { Textarea } from '../components/atoms/Textarea';
import { Callout } from '../components/molecules/Callout';
import { Field } from '../components/molecules/Field';

export interface FormularioRegistroProps {
  errores?: Record<string, string>;
  guardando?: boolean;
}

export function FormularioRegistro({ errores = {}, guardando = false }: FormularioRegistroProps) {
  const listaErrores = Object.entries(errores).filter(([, mensaje]) => Boolean(mensaje));

  return (
    <form
      className="max-w-3xl space-y-6"
      aria-busy={guardando}
      onSubmit={(event) => event.preventDefault()}
    >
      {listaErrores.length > 0 ? (
        <Callout tone="danger" role="alert" title="Revisa estos campos">
          <ul className="list-inside list-disc space-y-1">
            {listaErrores.map(([campo, mensaje]) => (
              <li key={campo}>
                <a className="underline underline-offset-2" href={`#${campo}`}>
                  {mensaje}
                </a>
              </li>
            ))}
          </ul>
        </Callout>
      ) : null}

      <Card>
        <CardContent className="space-y-4 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">Datos del paciente</h2>
          <Field label="Nombre completo" required error={errores.nombre}>
            <Input id="nombre" name="nombre" autoComplete="name" placeholder="Nombre y apellidos" />
          </Field>
          <Field label="Documento de identidad" required error={errores.documento}>
            <Input id="documento" name="documento" placeholder="Número de documento" />
          </Field>
          <Field label="Sexo registrado" hint="Dato administrativo, no clínico.">
            <Select id="sexo" name="sexo" defaultValue="">
              <option value="" disabled>
                Selecciona una opción
              </option>
              <option value="femenino">Femenino</option>
              <option value="masculino">Masculino</option>
              <option value="otro">Otro</option>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">Motivo de consulta</h2>
          <Field label="Motivo principal" required error={errores.motivo}>
            <Select id="motivo" name="motivo" defaultValue="">
              <option value="" disabled>
                Selecciona un motivo
              </option>
              <option value="control">Control de seguimiento</option>
              <option value="nuevo">Primera consulta</option>
              <option value="resultado">Revisión de resultados</option>
            </Select>
          </Field>
          <Field label="Observaciones" hint="Máximo 500 caracteres." error={errores.observaciones}>
            <Textarea id="observaciones" name="observaciones" placeholder="Notas de la consulta" />
          </Field>
          <Field label="Referencia externa">
            <Input
              id="referencia"
              name="referencia"
              placeholder="Centro o profesional de referencia"
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" disabled={guardando}>
          Cancelar
        </Button>
        <Button type="submit" loading={guardando}>
          Guardar registro
        </Button>
      </div>
    </form>
  );
}
