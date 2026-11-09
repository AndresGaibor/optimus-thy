import { useState } from 'react';
import {
  Button,
  Callout,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Field,
  Progress,
  Select,
} from '../../design-system';
import { unuqAtributos, unuqConsentimiento, unuqItems } from '../fixtures/unuq-extra';

type Respuestas = Array<number | undefined>;

const opciones = [
  { label: 'Selecciona una respuesta', value: '' },
  { label: '1 - Totalmente en desacuerdo', value: '1' },
  { label: '2 - En desacuerdo', value: '2' },
  { label: '3 - Neutral', value: '3' },
  { label: '4 - De acuerdo', value: '4' },
  { label: '5 - Totalmente de acuerdo', value: '5' },
];

export function UnuqQuestionnaire({ onSubmit }: { onSubmit: (values: number[]) => void }) {
  const [values, setValues] = useState<Respuestas>(() => unuqItems.map(() => undefined));
  const [consent, setConsent] = useState(false);
  const [intento, setIntento] = useState(false);
  const respondidos = values.filter((v): v is number => typeof v === 'number').length;
  const faltantes = unuqItems.filter((_, i) => typeof values[i] !== 'number');
  const invalido = !consent || faltantes.length > 0;
  const grupos = unuqAtributos.map((a) => ({
    atributo: a,
    items: unuqItems.filter((i) => i.atributo === a.nombre),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consentimiento y cuestionario UnUQ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <Callout tone="info" title="Consentimiento informado">
          {unuqConsentimiento}
        </Callout>
        <label className="flex items-start gap-3 text-sm">
          <Checkbox
            aria-label="Acepto el consentimiento informado"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>
            Acepto el consentimiento informado y confirmo que comprendo el propósito académico.
          </span>
        </label>
        <Progress
          label={`Progreso de respuestas: ${respondidos} de 22`}
          value={respondidos}
          max={22}
          tone={respondidos === 22 ? 'success' : 'info'}
        />
        <p className="text-sm text-muted-foreground">
          Respondidos: {respondidos}/22 · Pendientes: {22 - respondidos}
        </p>
        {intento && invalido ? (
          <Callout tone="warning" title="Faltan datos para calcular">
            {!consent ? 'Debes aceptar el consentimiento informado. ' : ''}
            {faltantes.length
              ? `Responde los ítems pendientes: ${faltantes.map((i) => i.id).join(', ')}.`
              : ''}
          </Callout>
        ) : null}
        {grupos.map(({ atributo, items }) => (
          <section
            key={atributo.nombre}
            className="space-y-3 rounded-card border border-border p-4"
          >
            <h3 className="font-semibold">{atributo.nombre}</h3>
            <p className="text-sm text-muted-foreground">
              {atributo.descripcion} · Peso demostrativo: {(atributo.peso * 100).toFixed(1)}%
            </p>
            {items.map((item) => {
              const idx = item.id - 1;
              return (
                <Field
                  key={item.id}
                  label={`Ítem ${item.id}. ${item.enunciado}`}
                  hint={`Atributo: ${item.atributo}`}
                >
                  <Select
                    aria-label={`Ítem ${item.id}: ${item.enunciado}`}
                    value={values[idx] == null ? '' : String(values[idx])}
                    onChange={(e) => {
                      const next = e.target.value === '' ? undefined : Number(e.target.value);
                      setValues((cur) => cur.map((v, i) => (i === idx ? next : v)));
                    }}
                  >
                    {opciones.map((o) => (
                      <option key={o.label} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              );
            })}
          </section>
        ))}
        <Button
          onClick={() => {
            setIntento(true);
            if (!invalido) onSubmit(values as number[]);
          }}
        >
          Calcular resultado UnUQ
        </Button>
      </CardContent>
    </Card>
  );
}
