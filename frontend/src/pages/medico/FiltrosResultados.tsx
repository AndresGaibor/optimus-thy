import { Input } from '../../design-system/components/atoms/Input';
import { Label } from '../../design-system/components/atoms/Label';
import { Select } from '../../design-system/components/atoms/Select';
import type { Paciente } from '../../api/pacientes';

/** Filtros combinables de la consulta de resultados (HU-081). */
export function FiltrosResultados({
  pacientes,
  paciente,
  desde,
  hasta,
  clase,
  onPaciente,
  onDesde,
  onHasta,
  onClase,
}: {
  pacientes: Paciente[];
  paciente: string;
  desde: string;
  hasta: string;
  clase: string;
  onPaciente: (valor: string) => void;
  onDesde: (valor: string) => void;
  onHasta: (valor: string) => void;
  onClase: (valor: string) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="filtro-paciente">Paciente</Label>
        <Select
          id="filtro-paciente"
          value={paciente}
          onChange={(evento) => onPaciente(evento.target.value)}
        >
          <option value="">Todos</option>
          {pacientes.map((fila) => (
            <option key={fila.id} value={fila.id}>
              {fila.codigo}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="filtro-desde">Desde</Label>
        <Input
          id="filtro-desde"
          type="date"
          value={desde}
          onChange={(evento) => onDesde(evento.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="filtro-hasta">Hasta</Label>
        <Input
          id="filtro-hasta"
          type="date"
          value={hasta}
          onChange={(evento) => onHasta(evento.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="filtro-clase">Clase</Label>
        <Select id="filtro-clase" value={clase} onChange={(evento) => onClase(evento.target.value)}>
          <option value="">Todas</option>
          <option value="benigno">Benigno</option>
          <option value="maligno">Maligno</option>
          <option value="sin_nodulo">Normal (sin nódulo)</option>
        </Select>
      </div>
    </div>
  );
}
