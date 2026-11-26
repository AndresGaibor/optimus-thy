import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Callout,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogClose,
  EmptyState,
  Spinner,
} from '../../design-system';
import {
  cerrarFicha,
  obtenerEstadoFicha,
  obtenerHistorialFicha,
  reabrirFicha,
  type EstadoFicha,
  type VersionFicha,
} from '../../api/fichas';

type Accion = 'cerrar' | 'reabrir';

const TITULO_DIALOGO: Record<Accion, string> = {
  cerrar: 'Cerrar ficha clínica',
  reabrir: 'Reabrir ficha clínica',
};

const TEXTO_CONFIRMACION: Record<Accion, string> = {
  cerrar:
    'Mientras la ficha esté cerrada no se podrán registrar cambios. Podrás reabrirla si hace falta corregir algo.',
  reabrir: 'Al reabrirla vuelven a permitirse cambios y queda constancia de quién lo hizo.',
};

const ETIQUETA_CONFIRMAR: Record<Accion, string> = {
  cerrar: 'Confirmar cierre',
  reabrir: 'Confirmar reapertura',
};

/**
 * Historial de versiones y estado de cierre de la ficha clínica de un caso.
 *
 * ## Cuándo usarlo
 * En la página e historia clínica de un caso, para consultar quién cambió qué y
 * para cerrar o reabrir la ficha. Requiere el identificador del caso ya cargado.
 *
 * ## Cuándo no usarlo
 * Fuera de la ficha de un caso, ni como historial de auditoría general: la
 * bitácora del sistema cubre ese alcance.
 *
 * ## Anatomía
 * Cabecera con el título y el botón de cerrar o reabrir; cuerpo con el aviso de
 * ficha cerrada, la lista de versiones (autor, fecha y valores antes → después)
 * y un diálogo de confirmación antes de cada acción.
 *
 * ## Accesibilidad
 * Cada acción pasa por un diálogo con título y descripción propios; el estado de
 * carga se anuncia con `role="status"` y el cierre se comunica con un `Callout`,
 * no solo con color. Los botones se deshabilitan mientras la petición está en curso.
 *
 * ## Responsive
 * La cabecera envuelve el botón debajo del título en pantallas estrechas; la lista
 * de versiones es una columna que se apila sin desplazamiento horizontal.
 */
export function FichaCasoPanel({ casoId }: { casoId: string }) {
  const [estado, setEstado] = useState<EstadoFicha | null>(null);
  const [versiones, setVersiones] = useState<VersionFicha[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accion, setAccion] = useState<Accion | null>(null);
  const [procesando, setProcesando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [ficha, historial] = await Promise.all([
        obtenerEstadoFicha(casoId),
        obtenerHistorialFicha(casoId),
      ]);
      setEstado(ficha ?? null);
      setVersiones(Array.isArray(historial) ? historial : []);
      setError(null);
    } catch {
      setError('No se pudo cargar el historial de la ficha.');
    } finally {
      setCargando(false);
    }
  }, [casoId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const confirmar = async () => {
    if (!accion) return;
    setProcesando(true);
    try {
      setEstado(accion === 'cerrar' ? await cerrarFicha(casoId) : await reabrirFicha(casoId));
      setAccion(null);
      setError(null);
    } catch {
      setError(
        accion === 'cerrar'
          ? 'No se pudo cerrar la ficha clínica.'
          : 'No se pudo reabrir la ficha clínica.',
      );
      setAccion(null);
    } finally {
      setProcesando(false);
    }
  };

  const cerrada = estado?.cerrada_en != null;

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <CardTitle>Historial de la ficha</CardTitle>
          <CardDescription>
            Autor, fecha y valores de cada cambio; el cierre bloquea ediciones posteriores.
          </CardDescription>
        </div>
        {estado?.registrada ? (
          <Button
            type="button"
            variant={cerrada ? 'outline' : 'default'}
            disabled={procesando}
            onClick={() => setAccion(cerrada ? 'reabrir' : 'cerrar')}
          >
            {cerrada ? 'Reabrir ficha' : 'Cerrar ficha'}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {cargando ? (
          <div className="flex items-center gap-2 text-muted-foreground" role="status">
            <Spinner /> Cargando el historial de la ficha…
          </div>
        ) : null}

        {error ? (
          <Callout tone="danger" title="No se pudo cargar la ficha">
            {error}
          </Callout>
        ) : null}

        {!cargando && cerrada ? (
          <Callout tone="info" title="Ficha cerrada">
            {estado?.cerrada_por_nombre
              ? `Cerrada por ${estado.cerrada_por_nombre}. Reábrela para registrar correcciones.`
              : 'La ficha está cerrada. Reábrela para registrar correcciones.'}
          </Callout>
        ) : null}

        {!cargando && !error && versiones.length === 0 ? (
          <EmptyState
            title="Sin versiones"
            description="Los cambios de la ficha aparecerán aquí en cuanto se registre el primero."
          />
        ) : null}

        {versiones.length > 0 ? (
          <ol className="flex flex-col gap-3">
            {versiones.map((version) => (
              <li key={version.version} className="rounded-panel border border-border p-3">
                <p className="text-sm font-medium text-foreground">
                  {`Versión ${version.version} · ${version.autor_nombre ?? 'Sin autor'}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(version.creado_en).toLocaleString('es-EC')}
                </p>
                <ul className="mt-2 flex flex-col gap-1 text-sm text-foreground">
                  {version.campos_cambiados.map((campo) => (
                    <li key={campo}>
                      {`${campo}: ${version.antes?.[campo] ?? 'vacío'} → ${
                        version.despues[campo] ?? 'vacío'
                      }`}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        ) : null}
      </CardContent>

      <Dialog
        open={accion !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setAccion(null);
        }}
        title={accion ? TITULO_DIALOGO[accion] : ''}
        description={accion ? TEXTO_CONFIRMACION[accion] : undefined}
        footer={
          <>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={() => void confirmar()} loading={procesando}>
              {accion ? ETIQUETA_CONFIRMAR[accion] : ''}
            </Button>
          </>
        }
      />
    </Card>
  );
}
