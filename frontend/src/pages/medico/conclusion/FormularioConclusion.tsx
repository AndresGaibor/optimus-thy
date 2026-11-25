import { Badge, Callout, Field, Input, Select, Textarea } from '../../../design-system';
import {
  CATEGORIAS,
  FORMATO_FECHA,
  NOTA_MAXIMA,
  NOTA_MINIMA,
  type CategoriaConclusion,
  type Errores,
  type InferenciaResumen,
  type ResultadoInferencia,
} from './compartidos';

interface FormularioConclusionProps {
  inferencia: InferenciaResumen;
  resultado: ResultadoInferencia;
  categoria: CategoriaConclusion | '';
  nota: string;
  errores: Errores;
  onCategoriaChange: (categoria: CategoriaConclusion | '') => void;
  onNotaChange: (nota: string) => void;
}

export function FormularioConclusion({
  inferencia,
  resultado,
  categoria,
  nota,
  errores,
  onCategoriaChange,
  onNotaChange,
}: FormularioConclusionProps) {
  return (
    <div className="flex flex-col gap-4">
      <Callout tone="info" title="La predicción no se modifica">
        Tu conclusión se registra aparte, con tu usuario y la fecha del servidor.
      </Callout>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Predicción del modelo</dt>
          <dd>
            <Badge tone={resultado.tono}>{resultado.texto}</Badge>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Confianza</dt>
          <dd>
            {inferencia.confianza === null ? '—' : `${(inferencia.confianza * 100).toFixed(1)} %`}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Fecha de la inferencia</dt>
          <dd>{FORMATO_FECHA.format(new Date(inferencia.creado_en))}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Modelo</dt>
          <dd>
            {inferencia.modelo.nombre} {inferencia.modelo.version}
          </dd>
        </div>
      </dl>

      <Field label="Categoría" required error={errores.categoria}>
        <Select
          value={categoria}
          onChange={(event) =>
            onCategoriaChange(event.currentTarget.value as CategoriaConclusion | '')
          }
        >
          <option value="">Selecciona una categoría</option>
          {CATEGORIAS.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.etiqueta}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Nota"
        required
        hint={`Mínimo ${NOTA_MINIMA} caracteres. Describe tu criterio clínico.`}
        error={errores.nota}
      >
        <Textarea
          value={nota}
          maxLength={NOTA_MAXIMA}
          onChange={(event) => onNotaChange(event.currentTarget.value)}
        />
      </Field>
      <p className="text-sm text-muted-foreground">
        {nota.length} / {NOTA_MAXIMA} caracteres
      </p>

      <Field
        label="Fecha de la conclusión"
        hint="La fecha y la hora las asigna el servidor al guardar; no se editan aquí."
      >
        <Input readOnly value="Se asigna al guardar" />
      </Field>
    </div>
  );
}
