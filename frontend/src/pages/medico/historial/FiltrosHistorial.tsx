import { Input } from '../../../design-system/components/atoms/Input';
import { Label } from '../../../design-system/components/atoms/Label';
import { Select } from '../../../design-system/components/atoms/Select';
import type { Paciente } from '../../../api/pacientes';

interface FiltrosHistorialProps {
  pacientes: Paciente[];
  paciente: string;
  desde: string;
  hasta: string;
  clase: string;
  onPaciente: (valor: string) => void;
  onDesde: (valor: string) => void;
  onHasta: (valor: string) => void;
  onClase: (valor: string) => void;
}

/** Filtros combinables que acepta `GET /resultados`. */
export function FiltrosHistorial({
  pacientes,
  paciente,
  desde,
  hasta,
  clase,
  onPaciente,
  onDesde,
  onHasta,
  onClase,
}: FiltrosHistorialProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="historial-paciente">Paciente</Label>
        <Select
          id="historial-paciente"
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
        <Label htmlFor="historial-desde">Desde</Label>
        <Input
          id="historial-desde"
          type="date"
          value={desde}
          onChange={(evento) => onDesde(evento.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="historial-hasta">Hasta</Label>
        <Input
          id="historial-hasta"
          type="date"
          value={hasta}
          onChange={(evento) => onHasta(evento.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="historial-clase">Clase</Label>
        <Select
          id="historial-clase"
          value={clase}
          onChange={(evento) => onClase(evento.target.value)}
        >
          <option value="">Todas</option>
          <option value="benigno">Benigno</option>
          <option value="maligno">Maligno</option>
          <option value="sin_nodulo">Normal (sin nódulo)</option>
        </Select>
      </div>
    </div>
  );
}
