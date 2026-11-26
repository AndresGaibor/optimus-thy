import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Button,
  Callout,
  EmptyState,
  PageHeader,
  Spinner,
  SupportNotice,
} from '../../design-system';
import { obtenerCaso, type CasoDetalle } from '../../api/casos';
import { listarConsentimientos, type Consentimiento } from '../../api/consentimientos';
import { listarImagenes, type ImagenCaso } from '../../api/imagenes';
import { listarResultados, type Inferencia } from '../../api/resultados';
import { consultarTrabajo, encolarInferencia } from '../../api/trabajos';
import { GaleriaImagenes } from './GaleriaImagenes';
import { ConsentimientosCaso } from './ConsentimientosCaso';
import { ResultadosDelCaso } from './ResultadosDelCaso';
import { DialogoSubida } from './inferencia/DialogoSubida';
import { useSubidaEcografia } from './inferencia/useSubidaEcografia';
import { AbrirVisor } from './visor/AbrirVisor';
import { CronologiaCaso } from './CronologiaCaso';
import { ExportarPaciente } from './ExportarPaciente';

const INTERVALO_MS = 3000;

export function CasoPage() {
  const { casoId = '' } = useParams();
  const [caso, setCaso] = useState<CasoDetalle | null>(null);
  const [imagenes, setImagenes] = useState<ImagenCaso[]>([]);
  const [resultados, setResultados] = useState<Inferencia[]>([]);
  const [consentimientos, setConsentimientos] = useState<Consentimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [analizando, setAnalizando] = useState<string | null>(null);
  const intervalo = useRef<number | null>(null);
  const [errorExportacion, setErrorExportacion] = useState<string | null>(null);

  const detener = useCallback(() => {
    if (intervalo.current !== null) {
      window.clearInterval(intervalo.current);
      intervalo.current = null;
    }
  }, []);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [datosCaso, datosImagenes, datosResultados, datosConsentimientos] = await Promise.all([
        obtenerCaso(casoId),
        listarImagenes(casoId),
        listarResultados(casoId),
        listarConsentimientos(casoId),
      ]);
      setCaso(datosCaso);
      setImagenes(datosImagenes);
      setResultados(datosResultados);
      setConsentimientos(datosConsentimientos);
    } catch {
      setError('No se pudo cargar el caso. Inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  }, [casoId]);

  useEffect(() => {
    void cargar();
    return detener;
  }, [cargar, detener]);

  const subida = useSubidaEcografia({
    casoId,
    alSubir: async (subidas) => {
      const mensaje =
        subidas === 1 ? 'Ecografía cargada y saneada.' : 'Ecografías cargadas y saneadas.';
      setAviso(mensaje);
      await cargar();
    },
  });

  const esperar = (trabajoId: string) => {
    detener();
    intervalo.current = window.setInterval(async () => {
      try {
        const trabajo = await consultarTrabajo(trabajoId);
        if (trabajo.estado === 'completado') {
          detener();
          setAnalizando(null);
          setAviso('Inferencia completada.');
          await cargar();
        } else if (trabajo.estado === 'error') {
          detener();
          setAnalizando(null);
          setError(
            'La inferencia falló. Revisa el estado del servicio de IA e inténtalo de nuevo.',
          );
        }
      } catch {
        detener();
        setAnalizando(null);
        setError('No se pudo consultar el trabajo de inferencia.');
      }
    }, INTERVALO_MS);
  };

  const analizar = async (imagen: ImagenCaso) => {
    setAnalizando(imagen.id);
    setError(null);
    setAviso('Inferencia en cola…');
    try {
      const trabajo = await encolarInferencia(imagen.id);
      esperar(trabajo.id);
    } catch {
      setAnalizando(null);
      setError('No se pudo encolar la inferencia.');
    }
  };

  if (cargando) {
    return <Spinner size="lg" label="Cargando el caso" />;
  }

  return (
    <main className="flex flex-col gap-6">
      <PageHeader
        title={caso ? `Caso ${caso.codigo}` : 'Caso'}
        description={caso ? `Paciente ${caso.paciente_codigo}` : undefined}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {caso ? (
              <ExportarPaciente pacienteId={caso.paciente_id} onError={setErrorExportacion} />
            ) : null}
            <Button onClick={subida.abrir}>Subir ecografía</Button>
          </div>
        }
      />
      {errorExportacion ? (
        <Callout tone="danger" title="Error" role="alert">
          {errorExportacion}
        </Callout>
      ) : null}
      <SupportNotice context="inferencia" />
      <ConsentimientosCaso
        casoId={casoId}
        consentimientos={consentimientos}
        onCambio={() => void cargar()}
      />
      {error ? (
        <Callout tone="danger" title="Error" role="alert">
          {error}
        </Callout>
      ) : null}
      {aviso ? (
        <Callout tone="success" title="Estado" role="status">
          {aviso}
        </Callout>
      ) : null}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Ecografías</h2>
        {imagenes.length === 0 ? (
          <EmptyState
            title="Sin ecografías"
            description="Sube una imagen PNG o JPEG para poder analizarla."
            action={<Button onClick={subida.abrir}>Subir ecografía</Button>}
          />
        ) : (
          <GaleriaImagenes
            imagenes={imagenes}
            analizando={analizando}
            puedeAnalizar={consentimientos.some(
              (consentimiento) =>
                consentimiento.vigente && consentimiento.base_legal === 'atencion_de_salud',
            )}
            onAnalizar={(imagen) => void analizar(imagen)}
          />
        )}
        {imagenes.length > 0 ? <AbrirVisor imagenes={imagenes} /> : null}
      </section>

      <ResultadosDelCaso resultados={resultados} casoId={casoId} imagenes={imagenes} />

      <DialogoSubida
        abierto={subida.abierta}
        archivos={subida.archivos}
        guardando={subida.guardando}
        onCambiarApertura={subida.cambiarApertura}
        onArchivo={subida.elegir}
        onSubir={() => void subida.subir()}
      />
      <CronologiaCaso casoId={casoId} />
    </main>
  );
}
