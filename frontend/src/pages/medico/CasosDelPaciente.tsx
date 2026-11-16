import { useNavigate } from 'react-router-dom';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../design-system';

export interface CasoResumen {
  id: string;
  codigo: string;
  creado_en: string;
}

const FORMATO_FECHA = new Intl.DateTimeFormat('es', { dateStyle: 'medium' });

/** Casos de un paciente con el acceso a su pantalla. */
export function CasosDelPaciente({ casos }: { casos: CasoResumen[] }) {
  const navigate = useNavigate();
  return (
    <div className="overflow-hidden rounded-panel border border-border">
      <Table caption="Listado de casos del paciente">
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {casos.map((caso) => (
            <TableRow key={caso.id}>
              <TableCell className="font-medium">{caso.codigo}</TableCell>
              <TableCell>{FORMATO_FECHA.format(new Date(caso.creado_en))}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/medico/casos/${caso.id}`)}
                >
                  Abrir
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
