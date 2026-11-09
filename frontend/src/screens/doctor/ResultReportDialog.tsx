import { useId, useState } from 'react';
import {
  Button,
  Callout,
  ConfidenceBadge,
  Dialog,
  Field,
  Label,
  ScanViewport,
  Switch,
  Textarea,
  TiradsBadge,
} from '../../design-system';
import type { ScanOverlay } from '../../design-system';
import type { DemoInference } from '../fixtures/types';

const REGION_OVERLAY: ScanOverlay = {
  id: 'region',
  label: 'Región analizada (ilustrativa)',
  shape: 'rect',
  x: 20,
  y: 14,
  width: 60,
  height: 47,
  tone: 'info',
};
const MARK_OVERLAY: ScanOverlay = {
  id: 'marca',
  label: 'Marca de apoyo (ilustrativa)',
  shape: 'ellipse',
  x: 41,
  y: 26,
  width: 14,
  height: 10,
  tone: 'ai',
};

export function OverlayView({ inference }: { inference: DemoInference }) {
  const [visible, setVisible] = useState(true);
  const id = useId();
  const no = inference.resultado.toLowerCase().includes('sin nódulo');
  return (
    <div className="space-y-4">
      <Callout tone="ai" title="Marcas geométricas ilustrativas">
        Marcas no clínicas. Apoyan la revisión profesional y no son un diagnóstico.
      </Callout>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">{inference.pacienteNombre}</span>
        <span className="text-muted-foreground">
          {inference.id} · {inference.fecha}
        </span>
        <TiradsBadge value={inference.tiRads} />
        <ConfidenceBadge value={inference.confianza} label="Confianza ilustrativa" />
      </div>
      <p>
        {no ? (
          <>
            <strong>Normal:</strong> sin nódulo detectado.
          </>
        ) : (
          inference.resultado
        )}
      </p>
      <div className="flex items-center gap-2">
        <Switch
          id={id}
          aria-label="Mostrar marcas ilustrativas"
          checked={visible}
          onCheckedChange={setVisible}
        />
        <Label htmlFor={id}>Mostrar marcas ilustrativas</Label>
      </div>
      <ScanViewport
        label={`Visor sintético con marcas ilustrativas de ${inference.id}`}
        overlays={no ? [REGION_OVERLAY] : [REGION_OVERLAY, MARK_OVERLAY]}
        showOverlays={visible}
        legendLabel="Leyenda de marcas"
        note="Ilustración sintética: no es una imagen clínica ni un diagnóstico."
      />
      {no && (
        <p className="text-sm text-muted-foreground">
          Sin nódulo detectado: el visor no incluye ninguna marca de hallazgo.
        </p>
      )}
    </div>
  );
}

export function ConclusionBox(props: {
  medico: string;
  value: string;
  savedAt?: string | undefined;
  onChange: (v: string) => void;
  onSave: () => void;
}) {
  return (
    <section
      aria-label="Conclusión del médico"
      className="space-y-3 rounded-md border border-border-subtle p-3"
    >
      <Field label="Conclusión del médico">
        <Textarea
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder="Escribe la conclusión profesional sobre el resultado."
          disabled={Boolean(props.savedAt)}
        />
      </Field>
      {props.savedAt ? (
        <Callout tone="success" title="Conclusión guardada">
          Firmada por {props.medico} · {props.savedAt}
        </Callout>
      ) : (
        <Button disabled={!props.value.trim()} onClick={props.onSave}>
          Guardar conclusión
        </Button>
      )}
    </section>
  );
}

export function ResultReportDialog(props: {
  selected: DemoInference | null;
  onOpenChange: (open: boolean) => void;
  medicoNombre: string;
  conclusion: string;
  savedAt?: string | undefined;
  onConclusionChange: (v: string) => void;
  onSaveConclusion: () => void;
  onOpenReport: (id: string) => void;
}) {
  const { selected } = props;
  return (
    <Dialog
      open={Boolean(selected)}
      onOpenChange={props.onOpenChange}
      title="Reporte de apoyo"
      description="El resultado no sustituye la revisión ni el juicio clínico."
    >
      <div className="space-y-4">
        <p className="font-medium">
          {selected?.resultado.toLowerCase().includes('sin nódulo') ? (
            <>
              <strong>Normal:</strong> sin nódulo detectado.
            </>
          ) : (
            selected?.resultado
          )}
        </p>
        <p>
          {selected?.pacienteNombre} · {selected?.fecha}
        </p>
        <p>
          Confianza: {selected?.confianza}% · Incertidumbre: {selected?.incertidumbre}% — valores
          ilustrativos, no rendimiento real.
        </p>
        <TiradsBadge value={selected?.tiRads ?? '—'} />
        <ScanViewport label="Overlay sintético para revisión" />
        {selected && (
          <ConclusionBox
            medico={props.medicoNombre}
            value={props.conclusion}
            savedAt={props.savedAt}
            onChange={props.onConclusionChange}
            onSave={props.onSaveConclusion}
          />
        )}
        <Button onClick={() => selected && props.onOpenReport(selected.id)}>
          Solicitar revisión clínica
        </Button>
      </div>
    </Dialog>
  );
}
