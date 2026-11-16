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

function EstadoDocumento({ estado }: { estado: DocumentoCasoDemo['estado'] }) {
  const config: Record<string, { tone: BadgeTone; label: string }> = {
    Listo: { tone: 'success', label: 'Listo' },
    Procesado: { tone: 'success', label: 'Procesado' },
    Pendiente: { tone: 'neutral', label: 'Pendiente' },
    'En cola': { tone: 'info', label: 'En cola' },
    Procesando: { tone: 'info', label: 'Procesando' },
    Error: { tone: 'danger', label: 'Error' },
  };
  const item = config[estado] ?? {
    tone: 'neutral' as BadgeTone,
    label: estado,
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
            <TableHead>Estado</TableHead>
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
                <EstadoDocumento estado={document.estado} />
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
