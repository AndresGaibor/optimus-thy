import { useState } from 'react';
import {
  Badge,
  Button,
  Callout,
  Dialog,
  DialogClose,
  Field,
  Input,
  Select,
  Textarea,
} from '../../design-system';

type CategoriaConclusion = 'acepta' | 'corrige' | 'descarta';
type Paso = 'formulario' | 'confirmacion';

const CATEGORIAS: Array<{ valor: CategoriaConclusion; etiqueta: string }> = [
  { valor: 'acepta', etiqueta: 'Acepto el resultado' },
  { valor: 'corrige', etiqueta: 'Corrijo el resultado' },
  { valor: 'descarta', etiqueta: 'Descarto el resultado' },
];

const RESULTADOS: Record<string, { texto: string; tono: 'success' | 'danger' | 'neutral' }> = {
  benigno: { texto: 'Benigno', tono: 'success' },
  maligno: { texto: 'Maligno', tono: 'danger' },
  sin_nodulo: { texto: 'Normal (sin nódulo)', tono: 'neutral' },
};

const SIN_CLASIFICAR = { texto: 'Sin clasificar', tono: 'neutral' as const };

const NOTA_MINIMA = 10;
const NOTA_MAXIMA = 2000;
const FORMATO_FECHA = new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium', timeStyle: 'short' });

/** Datos de la inferencia que la conclusión toma solo como referencia. */
interface InferenciaResumen {
  resultado: string;
  confianza: number | null;
  creado_en: string;
  modelo: { nombre: string; version: string };
}

interface ConclusionMedicaProps {
  abierta: boolean;
  onAbiertaChange: (abierta: boolean) => void;
  inferencia: InferenciaResumen;
}

interface Errores {
  categoria?: string;
  nota?: string;
}

/**
 * Formulario de conclusión del médico, separado de la predicción del modelo.
 *
 * La conclusión se redacta y se revisa, pero el envío queda bloqueado mientras el
 * backend no exponga el registro de decisiones médicas (RF-INF-09). La inferencia
 * original nunca se modifica desde aquí.
 */
export function ConclusionMedica({
  abierta,
  onAbiertaChange,
  inferencia,
}: ConclusionMedicaProps) {
  const [paso, setPaso] = useState<Paso>('formulario');
  const [categoria, setCategoria] = useState<CategoriaConclusion | ''>('');
  const [nota, setNota] = useState('');
  const [errores, setErrores] = useState<Errores>({});

  const resultado = RESULTADOS[inferencia.resultado] ?? SIN_CLASIFICAR;
  const etiquetaCategoria =
    CATEGORIAS.find((opcion) => opcion.valor === categoria)?.etiqueta ?? '—';

  function cambiarApertura(siguiente: boolean) {
    if (!siguiente) {
      setPaso('formulario');
      setCategoria('');
      setNota('');
      setErrores({});
    }
    onAbiertaChange(siguiente);
  }

  function revisar() {
    const siguientes: Errores = {};
    if (!categoria) {
      siguientes.categoria = 'Selecciona una categoría para tu conclusión.';
    }
    const limpia = nota.trim();
    if (!limpia) {
      siguientes.nota = 'Escribe una nota con tu criterio.';
    } else if (limpia.length < NOTA_MINIMA) {
      siguientes.nota = `La nota debe tener al menos ${NOTA_MINIMA} caracteres.`;
    }
    setErrores(siguientes);
    if (Object.keys(siguientes).length === 0) {
      setPaso('confirmacion');
    }
  }

  const formulario = (
    <div className="flex flex-col gap-4">
      <Callout tone="warning" title="El registro todavía no está disponible">
        El servidor aún no expone el guardado de conclusiones médicas. Puedes redactar y revisar
        tu conclusión, pero no se enviará ni se guardará al cerrar.
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
            {inferencia.confianza === null
              ? '—'
              : `${(inferencia.confianza * 100).toFixed(1)} %`}
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
            setCategoria(event.currentTarget.value as CategoriaConclusion | '')
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
          onChange={(event) => setNota(event.currentTarget.value)}
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

  const confirmacion = (
    <div className="flex flex-col gap-4">
      <Callout tone="warning" title="No se guardó nada">
        El servidor todavía no acepta conclusiones médicas. Cuando el registro esté disponible,
        la conclusión se enviará con tu usuario y la fecha del servidor.
      </Callout>

      <dl className="grid gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Categoría</dt>
          <dd>{etiquetaCategoria}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Nota</dt>
          <dd className="whitespace-pre-wrap">{nota.trim()}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Fecha</dt>
          <dd>Se asigna al guardar, en el servidor.</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Autor</dt>
          <dd>Tu usuario de la sesión.</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Predicción (sin cambios)</dt>
          <dd>
            <Badge tone={resultado.tono}>{resultado.texto}</Badge>
          </dd>
        </div>
      </dl>
    </div>
  );

  return (
    <Dialog
      open={abierta}
      onOpenChange={cambiarApertura}
      title={paso === 'formulario' ? 'Conclusión del médico' : 'Revisa tu conclusión'}
      description={
        paso === 'formulario'
          ? 'Redacta tu criterio aparte de la predicción; la inferencia original no cambia.'
          : 'Así quedará tu conclusión. Todavía no se puede guardar en el servidor.'
      }
      size="lg"
      footer={
        paso === 'formulario' ? (
          <>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={revisar}>Revisar conclusión</Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => setPaso('formulario')}>
              Volver
            </Button>
            <DialogClose asChild>
              <Button>Cerrar</Button>
            </DialogClose>
          </>
        )
      }
    >
      {paso === 'formulario' ? formulario : confirmacion}
    </Dialog>
  );
}
