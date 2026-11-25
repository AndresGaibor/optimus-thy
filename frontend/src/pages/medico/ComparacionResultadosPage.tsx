import { AlertTriangle, CheckCircle2, Images } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../design-system/components/atoms/Button';
import { Label } from '../../design-system/components/atoms/Label';
import { Select } from '../../design-system/components/atoms/Select';
import { Spinner } from '../../design-system/components/atoms/Spinner';
import { Callout } from '../../design-system/components/molecules/Callout';
import { EmptyState } from '../../design-system/components/molecules/EmptyState';
import { PageHeader } from '../../design-system/components/molecules/PageHeader';
import { StatCard } from '../../design-system/components/molecules/StatCard';
import { GrupoComparacion } from './comparacion/GrupoComparacion';
import { filtrarGrupos, type FiltroVeredicto } from './comparacion/agrupacion';
import { LIMITE_COMPARACION, useComparacion } from './comparacion/useComparacion';

const FILTROS: Array<{ valor: FiltroVeredicto; etiqueta: string }> = [
  { valor: 'todas', etiqueta: 'Todas las imágenes' },
  { valor: 'difieren', etiqueta: 'Solo discrepancias' },
  { valor: 'coinciden', etiqueta: 'Solo coincidencias' },
];

/**
 * Comparación de resultados entre modelos para una misma imagen (HU-092).
 *
 * No existe endpoint de comparación: la pantalla agrupa en el cliente las
 * inferencias recientes de `GET /resultados` por `imagen_id`.
 */
export function ComparacionResultadosPage() {
  const { grupos, resumen, total, cargando, error, recargar } = useComparacion();
  const [filtro, setFiltro] = useState<FiltroVeredicto>('todas');
  const visibles = filtrarGrupos(grupos, filtro);
  const truncado = total > LIMITE_COMPARACION;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Investigación"
        title="Comparación de resultados"
        description="Para una misma imagen, revisa qué respondió cada modelo, con qué confianza y en qué coincide."
      />

      <Callout tone="warning" title="No es una recomendación clínica">
        Esta comparación describe las salidas de los modelos y sus coincidencias. No indica qué
        resultado es correcto ni sustituye el juicio del médico.
      </Callout>

      {error ? (
        <Callout tone="danger" title="No se pudo cargar la comparación" role="alert">
          <div className="flex flex-col items-start gap-3">
            <p>{error}</p>
            <Button variant="outline" onClick={() => void recargar()}>
              Reintentar
            </Button>
          </div>
        </Callout>
      ) : cargando ? (
        <Spinner size="lg" label="Cargando comparación" />
      ) : grupos.length === 0 ? (
        <EmptyState
          as="h2"
          title="Sin resultados para comparar"
          description="Cuando una misma imagen tenga inferencias de más de un modelo, aparecerán aquí."
        />
      ) : (
        <>
          {truncado ? (
            <Callout tone="info" title="Ventana de comparación">
              Se comparan las {LIMITE_COMPARACION} inferencias más recientes de {total} guardadas en
              la institución.
            </Callout>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Imágenes"
              value={resumen.imagenes}
              description={`${resumen.sinComparacion} con una sola inferencia`}
              icon={Images}
            />
            <StatCard
              label="Coincidencias"
              value={resumen.coincidencias}
              description="Todos los modelos asignan la misma clase"
              icon={CheckCircle2}
              tone="success"
            />
            <StatCard
              label="Discrepancias"
              value={resumen.discrepancias}
              description="Los modelos asignan clases distintas"
              icon={AlertTriangle}
              tone="warning"
            />
          </div>

          <div className="flex max-w-xs flex-col gap-2">
            <Label htmlFor="filtro-comparacion">Mostrar</Label>
            <Select
              id="filtro-comparacion"
              value={filtro}
              onChange={(evento) => {
                const valor = evento.target.value;
                if (valor === 'todas' || valor === 'difieren' || valor === 'coinciden') {
                  setFiltro(valor);
                }
              }}
            >
              {FILTROS.map((opcion) => (
                <option key={opcion.valor} value={opcion.valor}>
                  {opcion.etiqueta}
                </option>
              ))}
            </Select>
          </div>

          {visibles.length === 0 ? (
            <EmptyState
              as="h2"
              title="Sin imágenes en este filtro"
              description="No hay imágenes que cumplan el criterio seleccionado."
              action={
                <Button variant="outline" onClick={() => setFiltro('todas')}>
                  Ver todas
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-4">
              {visibles.map((grupo) => (
                <GrupoComparacion key={grupo.imagenId} grupo={grupo} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
