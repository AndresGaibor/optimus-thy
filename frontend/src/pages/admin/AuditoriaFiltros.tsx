import { Input } from '../../design-system/components/atoms/Input';
import { Label } from '../../design-system/components/atoms/Label';
import { Select } from '../../design-system/components/atoms/Select';
import { FilterBar } from '../../design-system/components/molecules/FilterBar';
import { OPCIONES_EVENTO } from './etiquetas-evento';
import { RECURSOS_AUDITORIA } from '../../api/auditoria';

export interface FiltrosAuditoria {
  usuario: string;
  accion: string;
  recurso: string;
  desde: string;
  hasta: string;
}

export const FILTROS_VACIOS: FiltrosAuditoria = {
  usuario: '',
  accion: '',
  recurso: '',
  desde: '',
  hasta: '',
};

export interface AuditoriaFiltrosProps {
  filtros: FiltrosAuditoria;
  usuarios: { id: string; correo: string }[];
  rangoInvalido: boolean;
  onCambio: (filtros: FiltrosAuditoria) => void;
}

/** Filtros de la bitácora; las fechas se envían y se muestran en UTC. */
export function AuditoriaFiltros({
  filtros,
  usuarios,
  rangoInvalido,
  onCambio,
}: AuditoriaFiltrosProps) {
  const hayFiltros = Object.values(filtros).some((valor) => valor !== '');
  const cambiar = (parcial: Partial<FiltrosAuditoria>) => onCambio({ ...filtros, ...parcial });

  return (
    <FilterBar
      label="Filtros de la bitácora"
      {...(hayFiltros ? { onReset: () => onCambio(FILTROS_VACIOS) } : {})}
    >
      <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="flex flex-col gap-1">
          <Label htmlFor="bitacora-usuario">Usuario</Label>
          <Select
            id="bitacora-usuario"
            value={filtros.usuario}
            onChange={(evento) => cambiar({ usuario: evento.target.value })}
          >
            <option value="">Todos los usuarios</option>
            {usuarios.map((fila) => (
              <option key={fila.id} value={fila.id}>
                {fila.correo}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="bitacora-evento">Evento</Label>
          <Select
            id="bitacora-evento"
            value={filtros.accion}
            onChange={(evento) => cambiar({ accion: evento.target.value })}
          >
            <option value="">Todos los eventos</option>
            {OPCIONES_EVENTO.map(({ accion, titulo }) => (
              <option key={accion} value={accion}>
                {titulo}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="bitacora-recurso">Recurso</Label>
          <Select
            id="bitacora-recurso"
            value={filtros.recurso}
            onChange={(evento) => cambiar({ recurso: evento.target.value })}
          >
            <option value="">Todos los recursos</option>
            {RECURSOS_AUDITORIA.map((valor) => (
              <option key={valor} value={valor}>
                {valor}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="bitacora-desde">Desde</Label>
          <Input
            id="bitacora-desde"
            type="date"
            value={filtros.desde}
            aria-invalid={rangoInvalido}
            onChange={(evento) => cambiar({ desde: evento.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="bitacora-hasta">Hasta</Label>
          <Input
            id="bitacora-hasta"
            type="date"
            value={filtros.hasta}
            aria-invalid={rangoInvalido}
            onChange={(evento) => cambiar({ hasta: evento.target.value })}
          />
        </div>
      </div>
    </FilterBar>
  );
}
