import { Input } from '../../../design-system/components/atoms/Input';
import { Label } from '../../../design-system/components/atoms/Label';
import { Select } from '../../../design-system/components/atoms/Select';
import { FilterBar } from '../../../design-system/components/molecules/FilterBar';
import { DECISIONES, FILTROS_VACIOS, RESULTADOS, type FiltrosPredicciones } from './compartidos';

export interface FiltrosPrediccionesProps {
  filtros: FiltrosPredicciones;
  rangoInvalido: boolean;
  onCambio: (filtros: FiltrosPredicciones) => void;
}

/** Filtros de la auditoría; el servidor aplica fechas, resultado, diferencia y caso. */
export function FiltrosPredicciones({
  filtros,
  rangoInvalido,
  onCambio,
}: FiltrosPrediccionesProps) {
  const hayFiltros = Object.values(filtros).some((valor) => valor !== '');
  const cambiar = (parcial: Partial<FiltrosPredicciones>) => onCambio({ ...filtros, ...parcial });

  return (
    <FilterBar
      label="Filtros de predicciones auditadas"
      {...(hayFiltros ? { onReset: () => onCambio(FILTROS_VACIOS) } : {})}
    >
      <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="flex flex-col gap-1">
          <Label htmlFor="predicciones-desde">Desde</Label>
          <Input
            id="predicciones-desde"
            type="date"
            value={filtros.desde}
            aria-invalid={rangoInvalido}
            onChange={(evento) => cambiar({ desde: evento.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="predicciones-hasta">Hasta</Label>
          <Input
            id="predicciones-hasta"
            type="date"
            value={filtros.hasta}
            aria-invalid={rangoInvalido}
            onChange={(evento) => cambiar({ hasta: evento.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="predicciones-resultado">Resultado</Label>
          <Select
            id="predicciones-resultado"
            value={filtros.resultado}
            onChange={(evento) => cambiar({ resultado: evento.target.value })}
          >
            <option value="">Todos los resultados</option>
            {Object.entries(RESULTADOS).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta.texto}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="predicciones-decision">Diferencia</Label>
          <Select
            id="predicciones-decision"
            value={filtros.decision}
            onChange={(evento) => cambiar({ decision: evento.target.value })}
          >
            <option value="">Todas las referencias</option>
            <option value="pendiente">Sin referencia (pendiente)</option>
            {Object.entries(DECISIONES).map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="predicciones-caso">Caso</Label>
          <Input
            id="predicciones-caso"
            type="text"
            placeholder="Identificador del caso"
            value={filtros.caso}
            onChange={(evento) => cambiar({ caso: evento.target.value })}
          />
        </div>
      </div>
    </FilterBar>
  );
}
