import {
  Button,
  EmptyState,
  Field,
  Select,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../design-system';
import type { DemoInstitution } from '../fixtures/admin-extra';

type InstitutionUser = { id: string; nombre: string; institucion: string };

export function InstitutionsTable({
  rows,
  users,
  assignments,
  notice,
  onAssign,
  onEdit,
  onDeactivate,
}: {
  rows: DemoInstitution[];
  users: InstitutionUser[];
  assignments: Record<string, string>;
  notice: string;
  onAssign: (userId: string, institutionId: string) => void;
  onEdit: (institution: DemoInstitution) => void;
  onDeactivate: (institution: DemoInstitution) => void;
}) {
  return (
    <>
      {notice ? (
        <p role="status" className="text-sm text-success">
          {notice}
        </p>
      ) : null}
      {rows.length ? (
        <div className="overflow-x-auto">
          <Table caption="Instituciones de demostración">
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Usuarios activos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Asignar usuario</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((institution) => (
                <TableRow key={institution.id}>
                  <TableCell className="font-medium">{institution.codigo}</TableCell>
                  <TableCell>{institution.nombre}</TableCell>
                  <TableCell>
                    {users.filter((user) => assignments[user.id] === institution.id).length ||
                      institution.usuariosActivos}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      kind="user"
                      status={institution.estado === 'Activa' ? 'Activo' : 'Inactivo'}
                    />
                  </TableCell>
                  <TableCell>
                    <Field label={`Institución para ${institution.nombre}`}>
                      <Select
                        aria-label={`Asignar usuario a ${institution.nombre}`}
                        value={
                          users.find((user) => assignments[user.id] === institution.id)?.id ?? ''
                        }
                        onChange={(event) => onAssign(event.target.value, institution.id)}
                      >
                        <option value="">Seleccionar usuario</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.nombre}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => onEdit(institution)}>
                        Editar
                      </Button>
                      {institution.estado === 'Activa' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeactivate(institution)}
                        >
                          Desactivar
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title="Sin instituciones"
          description="No hay instituciones de demostración para mostrar."
        />
      )}
    </>
  );
}
