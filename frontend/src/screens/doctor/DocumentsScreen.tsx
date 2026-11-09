import { useMemo, useState } from 'react';
import {
  Button,
  Callout,
  Card,
  CardContent,
  FilterBar,
  SearchInput,
  Select,
} from '../../design-system';
import type { DescargaDocumentoDemo, DocumentoCasoDemo } from '../fixtures/documentos-extra';
import { DemoRoleLayout } from '../shared/DemoRoleLayout';
import { ScreenFrame } from '../shared/ScreenFrame';
import { DocumentDownloadDialog } from './DocumentDownloadDialog';
import { DocumentTable } from './DocumentTable';
import { DocumentUploadDialog } from './DocumentUploadDialog';

export interface DocumentsScreenProps {
  documents: DocumentoCasoDemo[];
  casoId: string;
  pacienteNombre: string;
  download: DescargaDocumentoDemo;
  onDownload: (id: string) => void;
  onUpload: () => void;
  initialUploadError?: 'tipo' | 'danado';
  initialNotice?: 'carga' | 'descarga';
}

export function DocumentsScreen({
  documents,
  casoId,
  pacienteNombre,
  download,
  onDownload,
  onUpload,
  initialUploadError,
  initialNotice,
}: DocumentsScreenProps) {
  const [query, setQuery] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [notice, setNotice] = useState<'carga' | 'descarga' | null>(initialNotice ?? null);
  const [downFor, setDownFor] = useState<DocumentoCasoDemo | null>(null);
  const shown = useMemo(
    () =>
      documents.filter((document) =>
        `${document.id} ${document.nombre} ${document.tipo}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [documents, query],
  );

  return (
    <DemoRoleLayout role="medico">
      <ScreenFrame
        title="Documentos del caso"
        description={`${casoId} · ${pacienteNombre}. Archivos almacenados de forma privada; acceso controlado.`}
        actions={
          <Button
            onClick={() => {
              setNotice(null);
              setUploadOpen(true);
            }}
          >
            Cargar documento
          </Button>
        }
      >
        <div role="status" className="empty:hidden">
          {notice === 'carga' && (
            <Callout tone="success" title="Documento registrado">
              Se validó el tipo y el archivo; se registró en bitácora de forma privada
              (demostración).
            </Callout>
          )}
          {notice === 'descarga' && (
            <Callout tone="info" title="Descarga registrada">
              Evento de descarga registrado para {download.documentoId} por {download.usuario}.
            </Callout>
          )}
        </div>
        <Card>
          <CardContent className="space-y-4 p-5">
            <FilterBar label="Filtros">
              <SearchInput
                label="Buscar documentos"
                placeholder="Buscar por nombre o id"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <Select aria-label="Tipo" defaultValue="Todos">
                <option>Todos</option>
                <option>PDF</option>
                <option>PNG</option>
                <option>JPEG</option>
              </Select>
            </FilterBar>
            <DocumentTable
              documents={shown}
              onView={setDownFor}
              onDownload={(document) => {
                setDownFor(document);
                onDownload(document.id);
              }}
            />
          </CardContent>
        </Card>
        <DocumentUploadDialog
          open={uploadOpen}
          initialError={initialUploadError}
          onOpenChange={setUploadOpen}
          onUpload={() => {
            setNotice('carga');
            onUpload();
          }}
        />
        <DocumentDownloadDialog
          document={downFor}
          download={download}
          onOpenChange={(open) => !open && setDownFor(null)}
          onConfirm={() => {
            setNotice('descarga');
            setDownFor(null);
          }}
        />
      </ScreenFrame>
    </DemoRoleLayout>
  );
}
