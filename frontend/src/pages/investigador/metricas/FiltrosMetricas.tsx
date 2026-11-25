import type { ModeloMetricas } from '../../../api/metricas';
import { Input } from '../../../design-system/components/atoms/Input';
import { Label } from '../../../design-system/components/atoms/Label';
import { Select } from '../../../design-system/components/atoms/Select';
import { FilterBar } from '../../../design-system/components/molecules/FilterBar';
import { FILTROS_METRICAS_VACIOS, type FiltrosMetricas } from './compartidos';

interface FiltrosMetricasProps {
  filtros: FiltrosMetricas;
  modelos: ModeloMetricas[];
  rangoInvalido: boolean;
  onCambio: (filtros: FiltrosMetricas) => void;
}

/** Filtros por fecha de inferencia y versión de modelo. */
export function FiltrosMetricas({
  filtros,
  modelos,
  rangoInvalido,
  onCambio,
}: FiltrosMetricasProps) {
  const hayFiltros = Object.values(filtros).some(Boolean);
  const cambiar = (parcial: Partial<FiltrosMetricas>) => onCambio({ ...filtros, ...parcial });

  return (
    <FilterBar
      label="Filtros de métricas"
      {...(hayFiltros ? { onReset: () => onCambio(FILTROS_METRICAS_VACIOS) } : {})}
    >
      <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="metricas-desde">Desde</Label>
          <Input
            id="metricas-desde"
            type="date"
            value={filtros.desde}
            aria-invalid={rangoInvalido}
            onChange={(evento) => cambiar({ desde: evento.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="metricas-hasta">Hasta</Label>
          <Input
            id="metricas-hasta"
            type="date"
            value={filtros.hasta}
            aria-invalid={rangoInvalido}
            onChange={(evento) => cambiar({ hasta: evento.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="metricas-modelo">Modelo</Label>
          <Select
            id="metricas-modelo"
            value={filtros.modelo}
            onChange={(evento) => cambiar({ modelo: evento.target.value })}
          >
            <option value="">Todos los modelos</option>
            {modelos.map((modelo) => (
              <option key={modelo.id} value={modelo.id}>
                {modelo.nombre} · {modelo.version}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </FilterBar>
  );
}
