import { useState } from 'react';
import { Dialog, StatCard } from '../../design-system';
import type { DemoInference } from '../fixtures/types';
import { DemoRoleLayout } from '../shared/DemoRoleLayout';
import { ScreenFrame } from '../shared/ScreenFrame';
import { OverlayView, ResultReportDialog } from './ResultReportDialog';
import { ResultsList } from './ResultsList';

export interface ResultsScreenProps {
  inferences: DemoInference[];
  onOpenReport: (id: string) => void;
  /** Se invoca con el identificador al abrir el visor de marcas ilustrativas. */
  onOpenOverlay: (id: string) => void;
  medicoNombre?: string;
  onSaveConclusion?: (inferenceId: string, conclusion: string) => void;
}

export function ResultsScreen({
  inferences,
  onOpenReport,
  onOpenOverlay,
  medicoNombre = 'Dra. Demo Profesional',
  onSaveConclusion,
}: ResultsScreenProps) {
  const [selected, setSelected] = useState<DemoInference | null>(null);
  const [overlayFor, setOverlayFor] = useState<DemoInference | null>(null);
  const [conclusions, setConclusions] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, string>>({});
  const done = inferences.filter((x) => x.estado === 'Completado');
  const avg = done.length
    ? Math.round((done.reduce((n, x) => n + x.confianza, 0) / done.length) * 10) / 10
    : 0;
  return (
    <DemoRoleLayout role="medico">
      <ScreenFrame
        title="Resultados de IA"
        description="Informes sintéticos para revisión profesional. Las cifras no representan rendimiento real."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Inferencias registradas" value={inferences.length} />
          <StatCard label="Confianza media ilustrativa" value={`${avg}%`} />
          <StatCard label="Completadas" value={done.length} />
        </div>
        <ResultsList
          inferences={done}
          onViewReport={setSelected}
          onViewOverlay={(x) => {
            setOverlayFor(x);
            onOpenOverlay(x.id);
          }}
        />
        <ResultReportDialog
          selected={selected}
          onOpenChange={(o) => !o && setSelected(null)}
          medicoNombre={medicoNombre}
          conclusion={selected ? (conclusions[selected.id] ?? '') : ''}
          savedAt={selected ? saved[selected.id] : undefined}
          onConclusionChange={(v) =>
            selected && setConclusions((m) => ({ ...m, [selected.id]: v }))
          }
          onSaveConclusion={() => {
            if (!selected) return;
            setSaved((m) => ({ ...m, [selected.id]: '2026-03-18 10:35' }));
            onSaveConclusion?.(selected.id, conclusions[selected.id] ?? '');
          }}
          onOpenReport={onOpenReport}
        />
        <Dialog
          open={Boolean(overlayFor)}
          onOpenChange={(o) => !o && setOverlayFor(null)}
          size="lg"
          title={overlayFor ? `Overlay sintético ${overlayFor.id}` : 'Overlay sintético'}
          description="Visor con marcas geométricas de demostración."
        >
          {overlayFor && <OverlayView key={overlayFor.id} inference={overlayFor} />}
        </Dialog>
      </ScreenFrame>
    </DemoRoleLayout>
  );
}
