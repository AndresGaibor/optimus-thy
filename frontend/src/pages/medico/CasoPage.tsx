import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Button,
  Callout,
  Dialog,
  DialogClose,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Spinner,
  SupportNotice,
} from '../../design-system';
import { obtenerCaso, type CasoDetalle } from '../../api/casos';
import { listarConsentimientos, type Consentimiento } from '../../api/consentimientos';
import { listarImagenes, subirImagen, type ImagenCaso } from '../../api/imagenes';
import { listarResultados, type Inferencia } from '../../api/resultados';
import { consultarTrabajo, encolarInferencia } from '../../api/trabajos';
import { GaleriaImagenes } from './GaleriaImagenes';
import { ConsentimientosCaso } from './ConsentimientosCaso';
import { ResultadoInferencia } from './ResultadoInferencia';

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
  const [subidaAbierta, setSubidaAbierta] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [analizando, setAnalizando] = useState<string | null>(null);
  const intervalo = useRef<number | null>(null);

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

  const subir = async () => {
    if (!archivo) return;
    setGuardando(true);
    setError(null);
    try {
      await subirImagen(casoId, archivo);
      setSubidaAbierta(false);
      setArchivo(null);
      setAviso('Ecografía cargada y saneada.');
      await cargar();
    } catch {
      setError('No se pudo subir la ecografía. Comprueba que sea PNG o JPEG.');
    } finally {
      setGuardando(false);
    }
  };

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
        actions={<Button onClick={() => setSubidaAbierta(true)}>Subir ecografía</Button>}
      />
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
            action={<Button onClick={() => setSubidaAbierta(true)}>Subir ecografía</Button>}
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
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Resultados</h2>
        {resultados.length === 0 ? (
          <EmptyState
            title="Sin inferencias"
            description="Analiza una ecografía para ver el resultado por nódulo."
          />
        ) : (
          resultados.map((inferencia) => (
            <ResultadoInferencia key={inferencia.id} inferencia={inferencia} />
          ))
        )}
      </section>

      <Dialog
        open={subidaAbierta}
        onOpenChange={setSubidaAbierta}
        title="Subir ecografía"
        description="Se guarda una copia saneada, sin metadatos EXIF ni ICC."
        footer={
          <>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={() => void subir()} disabled={!archivo} loading={guardando}>
              Subir ecografía
            </Button>
          </>
        }
      >
        <Field label="Archivo PNG o JPEG" required>
          <Input
            type="file"
            accept="image/png,image/jpeg"
            onChange={(event) => setArchivo(event.currentTarget.files?.[0] ?? null)}
          />
        </Field>
      </Dialog>
    </main>
  );
}
