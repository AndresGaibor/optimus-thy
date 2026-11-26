import { useState, type FormEvent } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '../../design-system';
import type { FiltrosCohorte } from '../../api/cohortes';

interface FormularioCohorte {
  nombre: string;
  edad_min: string;
  edad_max: string;
  tirads: string;
  bethesda: string;
  tipo_diagnostico: string;
  desde: string;
  hasta: string;
}

const FORMULARIO_VACIO: FormularioCohorte = {
  nombre: '',
  edad_min: '',
  edad_max: '',
  tirads: '',
  bethesda: '',
  tipo_diagnostico: '',
  desde: '',
  hasta: '',
};

function validar(formulario: FormularioCohorte): { filtros?: FiltrosCohorte; error?: string } {
  const edadMin = formulario.edad_min ? Number(formulario.edad_min) : undefined;
  const edadMax = formulario.edad_max ? Number(formulario.edad_max) : undefined;
  if (edadMin !== undefined && (!Number.isInteger(edadMin) || edadMin < 0 || edadMin > 120)) {
    return { error: 'La edad mínima debe ser un entero entre 0 y 120.' };
  }
  if (edadMax !== undefined && (!Number.isInteger(edadMax) || edadMax < 0 || edadMax > 120)) {
    return { error: 'La edad máxima debe ser un entero entre 0 y 120.' };
  }
  if (edadMin !== undefined && edadMax !== undefined && edadMin > edadMax) {
    return { error: 'La edad mínima no puede superar la edad máxima.' };
  }
  if (formulario.desde && formulario.hasta && formulario.desde > formulario.hasta) {
    return { error: 'La fecha inicial no puede ser posterior a la final.' };
  }
  return {
    filtros: {
      ...(edadMin !== undefined ? { edad_min: edadMin } : {}),
      ...(edadMax !== undefined ? { edad_max: edadMax } : {}),
      ...(formulario.tirads ? { tirads: formulario.tirads.trim() } : {}),
      ...(formulario.bethesda ? { bethesda: formulario.bethesda.trim() } : {}),
      ...(formulario.tipo_diagnostico
        ? { tipo_diagnostico: formulario.tipo_diagnostico.trim() }
        : {}),
      ...(formulario.desde ? { desde: formulario.desde } : {}),
      ...(formulario.hasta ? { hasta: formulario.hasta } : {}),
    },
  };
}

interface Props {
  onCrear: (nombre: string, filtros: FiltrosCohorte) => Promise<string | null>;
}

/** Formulario de filtros clínicos para guardar una cohorte reutilizable. */
export function CohorteFormulario({ onCrear }: Props) {
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [error, setError] = useState<string | null>(null);

  function cambiar(campo: keyof FormularioCohorte, valor: string) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    const nombre = formulario.nombre.trim();
    if (!nombre || nombre.length > 120) {
      setError('El nombre es obligatorio y admite hasta 120 caracteres.');
      return;
    }
    const resultado = validar(formulario);
    if (resultado.error || !resultado.filtros) {
      setError(resultado.error ?? 'Revisa los filtros de la cohorte.');
      return;
    }
    const fallo = await onCrear(nombre, resultado.filtros);
    if (fallo) {
      setError(fallo);
      return;
    }
    setFormulario(FORMULARIO_VACIO);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva cohorte</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={(evento) => void enviar(evento)}>
          <div>
            <Label htmlFor="cohorte-nombre">Nombre</Label>
            <Input
              id="cohorte-nombre"
              maxLength={120}
              value={formulario.nombre}
              onChange={(e) => cambiar('nombre', e.target.value)}
              required
            />
          </div>
          <fieldset className="grid gap-4 md:grid-cols-2">
            <legend className="mb-3 text-sm font-medium">Filtros clínicos</legend>
            <div>
              <Label htmlFor="edad-min">Edad mínima</Label>
              <Input
                id="edad-min"
                type="number"
                min={0}
                max={120}
                value={formulario.edad_min}
                onChange={(e) => cambiar('edad_min', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edad-max">Edad máxima</Label>
              <Input
                id="edad-max"
                type="number"
                min={0}
                max={120}
                value={formulario.edad_max}
                onChange={(e) => cambiar('edad_max', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="tirads">TIRADS</Label>
              <Input
                id="tirads"
                maxLength={16}
                value={formulario.tirads}
                onChange={(e) => cambiar('tirads', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="bethesda">Bethesda</Label>
              <Input
                id="bethesda"
                maxLength={16}
                value={formulario.bethesda}
                onChange={(e) => cambiar('bethesda', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="diagnostico">Tipo de diagnóstico</Label>
              <Input
                id="diagnostico"
                maxLength={64}
                value={formulario.tipo_diagnostico}
                onChange={(e) => cambiar('tipo_diagnostico', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="desde">Desde</Label>
              <Input
                id="desde"
                type="date"
                value={formulario.desde}
                onChange={(e) => cambiar('desde', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="hasta">Hasta</Label>
              <Input
                id="hasta"
                type="date"
                value={formulario.hasta}
                onChange={(e) => cambiar('hasta', e.target.value)}
              />
            </div>
          </fieldset>
          {error ? (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit">Guardar cohorte</Button>
        </form>
      </CardContent>
    </Card>
  );
}
