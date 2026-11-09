import { useState } from 'react';
import { Button, Callout } from '../../design-system';
import type { DemoImage, DemoPatient } from '../fixtures/types';
import { DemoRoleLayout } from '../shared/DemoRoleLayout';
import { ScreenFrame } from '../shared/ScreenFrame';
import { ImageUploadDialog } from './ImageUploadDialog';
import { ImagesGallery } from './ImagesGallery';

export interface ImagesScreenProps {
  images: DemoImage[];
  patients: DemoPatient[];
  /** Se invoca sin datos al validar el formulario de demostración; no se sube ningún archivo. */
  onRequestUpload: () => void;
  onRequestDownload: (id: string) => void;
  onSelectForInference?: (id: string) => void;
  /** HU-062: muestra selector accesible y galería con estado por imagen. */
  selectorInferencia?: boolean;
}

export function ImagesScreen({
  images,
  patients,
  onRequestUpload,
  onRequestDownload,
  onSelectForInference,
  selectorInferencia = false,
}: ImagesScreenProps) {
  const [uploading, setUploading] = useState(false),
    [submitted, setSubmitted] = useState(false),
    [confirmedInferenceId, setConfirmedInferenceId] = useState('');
  return (
    <DemoRoleLayout role="medico">
      <ScreenFrame
        title="Imágenes médicas"
        description={`${images.length} estudios sintéticos disponibles`}
        actions={
          <Button
            onClick={() => {
              setSubmitted(false);
              setUploading(true);
            }}
          >
            Solicitar carga
          </Button>
        }
      >
        <div role="status" className="empty:hidden">
          {submitted && (
            <Callout tone="info" title="Formulario de demostración validado">
              Se llamó a la acción de demostración; no se subió, leyó ni procesó ningún archivo.
            </Callout>
          )}
          {confirmedInferenceId && (
            <Callout tone="success" title="Imagen elegida para inferencia">
              {confirmedInferenceId} quedó seleccionada para el análisis. La elección será visible
              en el historial del caso.
            </Callout>
          )}
        </div>
        <ImagesGallery
          images={images}
          selectorInferencia={selectorInferencia}
          confirmedInferenceId={confirmedInferenceId}
          onConfirmInference={(id) => {
            setConfirmedInferenceId(id);
            onSelectForInference?.(id);
          }}
          onRequestDownload={onRequestDownload}
        />
        <ImageUploadDialog
          open={uploading}
          onOpenChange={setUploading}
          patients={patients}
          onValid={() => {
            setUploading(false);
            setSubmitted(true);
            onRequestUpload();
          }}
        />
      </ScreenFrame>
    </DemoRoleLayout>
  );
}
