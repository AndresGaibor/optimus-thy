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
import type { DocumentoCasoDemo } from '../fixtures/documentos-extra';

function EstadoOcr({ estado }: { estado: DocumentoCasoDemo['estadoOcr'] }) {
  const config: Record<string, { tone: BadgeTone; label: string }> = {
    Listo: { tone: 'success', label: 'OCR procesado' },
    Procesado: { tone: 'success', label: 'OCR procesado' },
    'Sin procesar': { tone: 'neutral', label: 'OCR pendiente' },
    Pendiente: { tone: 'neutral', label: 'OCR pendiente' },
    'En cola': { tone: 'info', label: 'OCR en cola' },
    Procesando: { tone: 'info', label: 'OCR procesando' },
    'En ejecución': { tone: 'info', label: 'OCR en ejecución' },
    Error: { tone: 'danger', label: 'OCR error' },
  };
  const item = config[estado] ?? {
    tone: 'neutral' as BadgeTone,
    label: `OCR ${estado.toLowerCase()}`,
  };
  return <Badge tone={item.tone}>{item.label}</Badge>;
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
                <EstadoOcr estado={document.estadoOcr} />
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
