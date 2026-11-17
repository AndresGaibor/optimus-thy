import { Input } from '../../design-system/components/atoms/Input';
import { Label } from '../../design-system/components/atoms/Label';
import { Select } from '../../design-system/components/atoms/Select';
import { Button } from '../../design-system/components/atoms/Button';
import type { Institucion } from '../../api/usuarios';

export type FiltroEstado = '' | 'activo' | 'inactivo';

export interface UsuariosFiltrosProps {
  busqueda: string;
  onBusqueda: (valor: string) => void;
  filtroEstado: FiltroEstado;
  onEstado: (valor: FiltroEstado) => void;
  filtroInstitucion: string;
  onInstitucion: (valor: string) => void;
  instituciones: Institucion[];
  hayFiltrosActivos: boolean;
  onLimpiar: () => void;
}

export function UsuariosFiltros({
  busqueda,
  onBusqueda,
  filtroEstado,
  onEstado,
  filtroInstitucion,
  onInstitucion,
  instituciones,
  hayFiltrosActivos,
  onLimpiar,
}: UsuariosFiltrosProps) {
  return (
    <div
      role="group"
      aria-label="Filtros de usuarios"
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="flex w-full flex-col gap-2 sm:w-80">
        <Label htmlFor="filtro-busqueda">Buscar usuario</Label>
        <Input
          id="filtro-busqueda"
          type="search"
          value={busqueda}
          onChange={(evento) => onBusqueda(evento.target.value)}
          placeholder="Nombre o correo electrónico"
        />
      </div>
      <div className="grid w-full grid-cols-1 gap-3 sm:contents">
        <div className="flex flex-col gap-2 sm:w-60">
          <Label htmlFor="filtro-institucion">Institución</Label>
          <Select
            id="filtro-institucion"
            value={filtroInstitucion}
            onChange={(evento) => onInstitucion(evento.target.value)}
          >
            <option value="">Todas las instituciones</option>
            {instituciones.map((institucion) => (
              <option key={institucion.id} value={institucion.id}>
                {institucion.nombre}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-2 sm:w-40">
          <Label htmlFor="filtro-estado">Estado</Label>
          <Select
            id="filtro-estado"
            value={filtroEstado}
            onChange={(evento) => onEstado(evento.target.value as FiltroEstado)}
          >
            <option value="">Todos</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </Select>
        </div>
      </div>
      {hayFiltrosActivos ? (
        <Button variant="ghost" size="sm" onClick={onLimpiar} className="self-start sm:ml-auto">
          Limpiar filtros
        </Button>
      ) : null}
    </div>
  );
}
