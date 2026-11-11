import {
  Badge,
  Button,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type BadgeTone,
} from '../../design-system';
import type { DocumentoCasoDemo, OcrEstado } from '../fixtures/documentos-extra';

const ESTADOS_OCR: Record<OcrEstado, { tone: BadgeTone; label: string }> = {
  'En cola': { tone: 'warning', label: 'En cola' },
  Procesando: { tone: 'info', label: 'Procesando' },
  Listo: { tone: 'success', label: 'Listo' },
  Error: { tone: 'danger', label: 'Error' },
};

function EstadoOcr({
  estado,
  motivo,
}: {
  estado: DocumentoCasoDemo['estadoOcr'];
  motivo?: string;
}) {
  if (estado === 'Sin procesar') return null;
  const { tone, label } = ESTADOS_OCR[estado];

  return (
    <div className="space-y-1">
      <Badge tone={tone}>{label}</Badge>
      {estado === 'Error' && motivo !== undefined ? (
        <p className="text-xs text-muted-foreground">{motivo}</p>
      ) : null}
    </div>
  );
}

export function DocumentTable({
  documents,
  onView,
  onDownload,
}: {
  documents: DocumentoCasoDemo[];
  onView: (document: DocumentoCasoDemo) => void;
  onDownload: (document: DocumentoCasoDemo) => void;
}) {
  if (!documents.length) {
    return (
      <EmptyState
        title="Sin documentos"
        description="Carga un PDF o imagen asociado al paciente y caso."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table caption="Documentos del caso (datos sintéticos)">
        <TableHeader>
          <TableRow>
            <TableHead>Documento</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Tamaño</TableHead>
            <TableHead>Estado OCR</TableHead>
            <TableHead>Subido por</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document) => (
            <TableRow key={document.id}>
              <TableCell>
                <p className="font-medium">{document.nombre}</p>
                <p className="text-xs text-muted-foreground">{document.id}</p>
              </TableCell>
              <TableCell>
                <Badge tone="neutral">{document.tipo}</Badge>
              </TableCell>
              <TableCell>{document.tamano}</TableCell>
              <TableCell>
                <EstadoOcr
                  estado={document.estadoOcr}
                  {...(document.motivoError === undefined ? {} : { motivo: document.motivoError })}
                />
              </TableCell>
              <TableCell>{document.subidoPor}</TableCell>
              <TableCell>{document.fecha}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => onView(document)}>
                    Ver
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => onDownload(document)}>
                    Descargar
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
