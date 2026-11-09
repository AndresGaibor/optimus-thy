import { useState, type FormEvent } from 'react';
import { Button, Callout, DialogClose, Field, Input, Select } from '../../design-system';

type Campo = 'tsh' | 't3' | 't4' | 'tamano' | 'tirads' | 'bethesda';
type Errores = Partial<Record<Campo, string>>;

const RANGOS: { campo: Campo; etiqueta: string; min: number; max: number; unidad: string }[] = [
  { campo: 'tsh', etiqueta: 'TSH', min: 0.01, max: 100, unidad: 'mUI/L' },
  { campo: 't3', etiqueta: 'T3', min: 0.1, max: 10, unidad: 'ng/mL' },
  { campo: 't4', etiqueta: 'T4', min: 0.5, max: 30, unidad: 'µg/dL' },
  { campo: 'tamano', etiqueta: 'Tamaño del nódulo (mm)', min: 0.01, max: 200, unidad: 'mm' },
];
const TIRADS_VALIDOS = ['1', '2', '3', '4', '5'];
const BETHESDA_VALIDOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'No realizada'];

export interface FichaRangosFormProps {
  valoresIniciales?: Partial<Record<Campo, string>>;
  validarTirads?: boolean;
  validarBethesda?: boolean;
  onValido?: () => void;
}

export function FichaRangosForm({
  valoresIniciales = {},
  validarTirads,
  validarBethesda,
  onValido,
}: FichaRangosFormProps) {
  const [errores, setErrores] = useState<Errores>({});
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = (k: string) => String(data.get(k) ?? '').trim();
    const next: Errores = {};
    for (const r of RANGOS) {
      const raw = text(r.campo).replace(',', '.');
      const n = raw === '' ? null : Number(raw);
      const valido = n !== null && Number.isFinite(n) && n >= r.min && n <= r.max;
      if (!valido)
        next[r.campo] =
          `${r.etiqueta} fuera de rango (${String(r.min).replace('.', ',')}–${r.max} ${r.unidad}). Verifica el valor.`;
    }
    const tirads = text('tirads');
    if (validarTirads && tirads && !TIRADS_VALIDOS.includes(tirads))
      next.tirads = 'TI-RADS solo acepta valores 1, 2, 3, 4 o 5.';
    const bethesda = text('bethesda');
    if (validarBethesda && bethesda && !BETHESDA_VALIDOS.includes(bethesda))
      next.bethesda = 'Bethesda solo acepta categorías I, II, III, IV, V, VI o “No realizada”.';
    setErrores(next);
    if (Object.keys(next).length === 0) onValido?.();
  };
  const hayErrores = Object.keys(errores).length > 0;
  return (
    <form noValidate onSubmit={submit} className="space-y-4">
      {hayErrores ? (
        <Callout tone="danger" role="alert" title="Valores fuera de rango">
          Corrige los campos marcados. Los valores fuera de rango se rechazan con un mensaje claro.
        </Callout>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {RANGOS.map((r) => (
          <Field
            key={r.campo}
            label={`${r.etiqueta} (${r.unidad})`}
            required
            error={errores[r.campo]}
          >
            <Input
              name={r.campo}
              defaultValue={valoresIniciales[r.campo] ?? ''}
              autoComplete="off"
            />
          </Field>
        ))}
        <Field label="TI-RADS" error={errores.tirads}>
          <Select name="tirads" defaultValue={valoresIniciales.tirads ?? ''}>
            <option value="">Sin dato</option>
            {['1', '2', '3', '4', '5', ...(validarTirads ? ['7'] : [])].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Bethesda" error={errores.bethesda}>
          <Select name="bethesda" defaultValue={valoresIniciales.bethesda ?? ''}>
            <option value="">Selecciona</option>
            {[
              'I',
              'II',
              'III',
              'IV',
              'V',
              'VI',
              'No realizada',
              ...(validarBethesda ? ['IX'] : []),
            ].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={hayErrores}>
          Guardar ficha
        </Button>
      </div>
    </form>
  );
}
