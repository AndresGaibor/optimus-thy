import { Button, Callout } from '../../../design-system';
import type { ImagenCaso } from '../../../api/imagenes';
import type { CasoResumen, PacienteDetalle } from '../../../api/pacientes';
import type { Inferencia } from '../../../api/resultados';
import { DialogoSubida } from './DialogoSubida';
import { EncabezadoDelCaso } from './EncabezadoDelCaso';
import { PanelConsentimiento } from './PanelConsentimiento';
import { PanelImagenes } from './PanelImagenes';
import { PanelResultados } from './PanelResultados';
import type { SubidaEcografia } from './useSubidaEcografia';

interface VistaDelCasoProps {
  paciente: PacienteDetalle;
  casoSeleccionado: CasoResumen;
  casos: CasoResumen[];
  casoId: string;
  aviso: string | null;
  errorCaso: string | null;
  cargandoCaso: boolean;
  subida: SubidaEcografia;
  imagenes: ImagenCaso[];
  resultados: Inferencia[];
  analizando: string | null;
  errorAnalisis: string | null;
  puedeReintentar: boolean;
  tieneConsentimiento: boolean;
  onCambiarCaso: (id: string) => void;
  onReintentarCaso: () => void;
  onAnalizar: (imagen: ImagenCaso) => void;
  onReintentarAnalisis: () => void;
}

/** Composición visual del caso: encabezado, avisos, paneles y diálogo de subida. */
export function VistaDelCaso({
  paciente,
  casoSeleccionado,
  casos,
  casoId,
  aviso,
  errorCaso,
  cargandoCaso,
  subida,
  imagenes,
  resultados,
  analizando,
  errorAnalisis,
  puedeReintentar,
  tieneConsentimiento,
  onCambiarCaso,
  onReintentarCaso,
  onAnalizar,
  onReintentarAnalisis,
}: VistaDelCasoProps) {
  return (
    <section className="mx-auto w-full max-w-(--content-max-width) space-y-6 px-4 py-6">
      <EncabezadoDelCaso
        paciente={paciente}
        casoSeleccionado={casoSeleccionado}
        casos={casos}
        casoId={casoId}
        aviso={aviso}
        errorCaso={errorCaso}
        cargandoCaso={cargandoCaso}
        onCambiarCaso={onCambiarCaso}
        onReintentarCaso={onReintentarCaso}
        onAbrirSubida={subida.abrir}
      >
        <PanelConsentimiento
          casoId={casoSeleccionado.id}
          tieneConsentimiento={tieneConsentimiento}
        />
        {errorAnalisis ? (
          <Callout tone="danger" title="La inferencia no se completó" role="alert">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{errorAnalisis}</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={onReintentarAnalisis}
                disabled={analizando !== null || !puedeReintentar}
              >
                Reintentar inferencia
              </Button>
            </div>
          </Callout>
        ) : null}
        <PanelImagenes
          imagenes={imagenes}
          analizando={analizando}
          puedeAnalizar={tieneConsentimiento}
          onAbrirSubida={subida.abrir}
          onAnalizar={onAnalizar}
        />
        <PanelResultados resultados={resultados} casoId={casoSeleccionado.id} imagenes={imagenes} />
      </EncabezadoDelCaso>
      <DialogoSubida
        abierto={subida.abierta}
        archivos={subida.archivos}
        guardando={subida.guardando}
        onCambiarApertura={subida.cambiarApertura}
        onArchivo={subida.elegir}
        onSubir={() => void subida.subir()}
      />
    </section>
  );
}
