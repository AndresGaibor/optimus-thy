import { useMemo, useRef, useState } from 'react';
import {
  Button,
  Callout,
  Card,
  CardContent,
  FilterBar,
  SearchInput,
  Select,
} from '../../design-system';
import { obtenerEnlaceDocumento } from '../../api/documentos';
import type { DocumentoCasoDemo } from '../fixtures/documentos-extra';
import { DemoRoleLayout } from '../shared/DemoRoleLayout';
import { ScreenFrame } from '../shared/ScreenFrame';
import { DocumentDownloadDialog, type EstadoDescargaDocumento } from './DocumentDownloadDialog';
import { DocumentTable } from './DocumentTable';
import { DocumentUploadDialog } from './DocumentUploadDialog';
import { useEstadosOcr } from './useEstadosOcr';

const ERROR_ENLACE = 'No se pudo obtener el enlace firmado. Vuelve a intentarlo en unos segundos.';

function abrirEnPestana(enlace: string): void {
  // Un enlace con `rel="noopener noreferrer"` no bloquea la navegación tras la
  // consulta asíncrona y la pestaña nueva no puede leer esta ventana.
  const ancla = document.createElement('a');
  ancla.href = enlace;
  ancla.target = '_blank';
  ancla.rel = 'noopener noreferrer';
  ancla.click();
}

export interface DocumentsScreenProps {
  documents: DocumentoCasoDemo[];
  casoId: string;
  pacienteNombre: string;
  onDownload: (id: string) => void;
  onUpload: () => void;
  initialUploadError?: 'tipo' | 'danado';
  initialNotice?: 'carga' | 'descarga';
}

export function DocumentsScreen({
  documents,
  casoId,
  pacienteNombre,
  onDownload,
  onUpload,
  initialUploadError,
  initialNotice,
}: DocumentsScreenProps) {
  const [query, setQuery] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [notice, setNotice] = useState<'carga' | 'descarga' | null>(initialNotice ?? null);
  const [downFor, setDownFor] = useState<DocumentoCasoDemo | null>(null);
  const [descarga, setDescarga] = useState<EstadoDescargaDocumento | null>(null);
  const [descargaRegistrada, setDescargaRegistrada] = useState<string | null>(null);
  const [enlaceError, setEnlaceError] = useState<string | null>(null);
  const solicitudDescarga = useRef(0);
  const solicitudVer = useRef(0);
  const documentosConOcr = useEstadosOcr(documents, casoId);

  const verDocumento = async (document: DocumentoCasoDemo) => {
    const solicitud = ++solicitudVer.current;
    setNotice(null);
    setEnlaceError(null);
    const enlace = await obtenerEnlaceDocumento(casoId, document.id).catch(() => null);
    if (solicitud !== solicitudVer.current) return;
    if (enlace === null) {
      setEnlaceError(ERROR_ENLACE);
      return;
    }
    abrirEnPestana(enlace.enlace);
  };

  const descargarDocumento = async (document: DocumentoCasoDemo) => {
    const solicitud = ++solicitudDescarga.current;
    setNotice(null);
    setEnlaceError(null);
    setDownFor(document);
    setDescarga({ estado: 'cargando' });
    const enlace = await obtenerEnlaceDocumento(casoId, document.id).catch(() => null);
    if (solicitud !== solicitudDescarga.current) return;
    if (enlace === null) {
      setDescarga({ estado: 'error', mensaje: ERROR_ENLACE });
      return;
    }
    setDescarga({ estado: 'listo', enlace: enlace.enlace, caducaEn: enlace.caduca_en });
    onDownload(document.id);
  };

  const cerrarDescarga = () => {
    solicitudDescarga.current += 1;
    setDownFor(null);
    setDescarga(null);
  };

  const shown = useMemo(
    () =>
      documentosConOcr.filter((document) =>
        `${document.id} ${document.nombre} ${document.tipo}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [documentosConOcr, query],
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
              El acceso quedó en la bitácora
              {descargaRegistrada === null ? '' : ` para ${descargaRegistrada}`}.
            </Callout>
          )}
          {enlaceError !== null && (
            <Callout tone="danger" title="No se pudo obtener el enlace">
              {enlaceError}
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
              onView={(document) => void verDocumento(document)}
              onDownload={(document) => void descargarDocumento(document)}
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
          descarga={descarga}
          onOpenChange={(open) => {
            if (!open) cerrarDescarga();
          }}
          onConfirm={() => {
            if (descarga?.estado !== 'listo') return;
            abrirEnPestana(descarga.enlace);
            setDescargaRegistrada(downFor?.id ?? null);
            setNotice('descarga');
            cerrarDescarga();
          }}
        />
      </ScreenFrame>
    </DemoRoleLayout>
  );
}
