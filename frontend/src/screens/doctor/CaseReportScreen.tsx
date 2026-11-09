import { useState } from 'react';
import {
  Badge,
  Button,
  Callout,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfidenceBadge,
  Dialog,
  ScanViewport,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TiradsBadge,
} from '../../design-system';
import type {
  DescargaReporteDemo,
  ReporteConsolidadoDemo,
  ReporteInferenciaDemo,
} from '../fixtures/reportes-extra';
import { DemoRoleLayout } from '../shared/DemoRoleLayout';
import { ScreenFrame } from '../shared/ScreenFrame';

export interface CaseReportScreenProps {
  mode: 'inferencia' | 'consolidado';
  reporte?: ReporteInferenciaDemo;
  consolidado?: ReporteConsolidadoDemo;
  descarga?: DescargaReporteDemo;
  onDownload?: (reporteId: string) => void;
  initialDownloadState?: 'idle' | 'loading' | 'registered';
}

export function CaseReportScreen({
  mode,
  reporte,
  consolidado,
  descarga,
  onDownload,
  initialDownloadState = 'idle',
}: CaseReportScreenProps) {
  const [downloadState, setDownloadState] = useState(initialDownloadState);
  const [dialogOpen, setDialogOpen] = useState(initialDownloadState === 'registered');
  const reportId = mode === 'consolidado' ? consolidado?.id : reporte?.id;
  const header = mode === 'consolidado' ? consolidado : reporte;
  const aviso = header?.avisoApoyo;

  const registrar = () => {
    if (!reportId) return;
    setDownloadState('loading');
    setTimeout(() => {
      setDownloadState('registered');
      setDialogOpen(true);
      onDownload?.(reportId);
    }, 0);
  };

  return (
    <DemoRoleLayout role="medico">
      <ScreenFrame
        title={mode === 'consolidado' ? 'Consolidado del caso' : 'Reporte de inferencia'}
        description="Documento de apoyo con trazabilidad para revisión profesional."
        actions={
          <Button onClick={registrar} disabled={downloadState === 'loading' || !reportId}>
            {downloadState === 'loading' ? 'Descargando…' : 'Descargar'}
          </Button>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle as="h2">
              {header?.institucion ?? 'ESPOCH'} · {header?.unidad ?? 'SOLCA'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {mode === 'consolidado' && consolidado ? (
              <>
                <p>
                  <span className="font-medium">Identificador verificable:</span>{' '}
                  <Badge tone="neutral">{consolidado.identificadorVerificable}</Badge>
                </p>
                <p>
                  <span className="font-medium">Caso:</span> {consolidado.pacienteNombre} (
                  {consolidado.pacienteId})
                </p>
              </>
            ) : reporte ? (
              <p>
                <span className="font-medium">Inferencia:</span> {reporte.inference.id} ·{' '}
                {reporte.inference.pacienteNombre} · {reporte.inference.fecha}
              </p>
            ) : null}
            {aviso ? (
              <Callout tone="warning" title="Aviso de apoyo">
                {aviso}
              </Callout>
            ) : null}
          </CardContent>
        </Card>

        {mode === 'consolidado' && consolidado ? (
          <Card>
            <CardHeader>
              <CardTitle as="h2">Inferencias incluidas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table caption="Inferencias incluidas en el consolidado">
                <TableHeader>
                  <TableRow>
                    <TableHead>Identificador</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Confianza</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consolidado.inferencias.map((x) => (
                    <TableRow key={x.id}>
                      <TableCell>{x.id}</TableCell>
                      <TableCell>{x.fecha}</TableCell>
                      <TableCell>{x.resultado}</TableCell>
                      <TableCell>{x.confianza}%</TableCell>
                      <TableCell>
                        <StatusBadge kind="inference" status={x.estado} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : reporte ? (
          <Card>
            <CardHeader>
              <CardTitle as="h2">Resultado de inferencia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{reporte.inference.resultado}</p>
              <div className="flex flex-wrap items-center gap-2">
                <ConfidenceBadge
                  value={reporte.inference.confianza}
                  label="Confianza ilustrativa"
                />
                <TiradsBadge value={reporte.inference.tiRads} />
              </div>
              <p>
                <span className="font-medium">Versión del modelo:</span> {reporte.modeloVersion}
              </p>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle as="h2">Imágenes incluidas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {(mode === 'consolidado' ? consolidado?.images : reporte?.images)?.map((img) =>
              img.src ? (
                <figure
                  key={img.id}
                  className="rounded-card border border-border bg-surface-subtle p-2"
                >
                  <img
                    src={img.src}
                    alt={`${img.tipo} ${img.subtipo} incluida en el reporte`}
                    className="block w-full rounded-md object-contain"
                  />
                  <figcaption className="mt-2 text-xs text-muted-foreground">{img.id}</figcaption>
                </figure>
              ) : (
                <ScanViewport key={img.id} label={`${img.id} · representación sintética`} />
              ),
            )}
          </CardContent>
        </Card>

        {downloadState === 'registered' && descarga ? (
          <Callout tone="info" title="Registro en bitácora">
            Descarga registrada para {descarga.reporteId}: usuario {descarga.usuario}, hora{' '}
            {descarga.hora}.
          </Callout>
        ) : null}

        <Dialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title="Descarga registrada"
          description="La acción quedó registrada en bitácora."
        >
          {descarga ? (
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Usuario:</span> {descarga.usuario}
              </p>
              <p>
                <span className="font-medium">Reporte:</span> {descarga.reporteId}
              </p>
              <p>
                <span className="font-medium">Hora:</span> {descarga.hora}
              </p>
            </div>
          ) : null}
        </Dialog>
      </ScreenFrame>
    </DemoRoleLayout>
  );
}
