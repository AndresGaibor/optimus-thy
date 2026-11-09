import {
  Button,
  EmptyState,
  RoleBadge,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../design-system';
import type { RoleKey } from '../../design-system';
import type { DemoUser } from '../fixtures/types';
import { MultiRoleSummary } from './MultiRoleSummary';

type UserRow = DemoUser & { roles?: RoleKey[]; rolActivo?: RoleKey };

export function UserTable({
  rows,
  onResetPassword,
  onRemove,
}: {
  rows: UserRow[];
  onResetPassword?: ((user: UserRow) => void) | undefined;
  onRemove: (id: string) => void;
}) {
  if (!rows.length) {
    return <EmptyState title="Sin usuarios" description="No se encontraron usuarios sintéticos." />;
  }

  return (
    <div className="overflow-x-auto">
      <Table caption="Directorio sintético de usuarios">
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Último acceso</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="font-medium">{user.nombre}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </TableCell>
              <TableCell>
                {user.roles && user.roles.length > 1 ? (
                  <MultiRoleSummary roles={user.roles} activeRole={user.rolActivo ?? user.rol} />
                ) : (
                  <RoleBadge role={user.rol} />
                )}
              </TableCell>
              <TableCell>
                <StatusBadge kind="user" status={user.estado} />
              </TableCell>
              <TableCell>{user.estado === 'Activo' ? 'Hoy' : '—'}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  {onResetPassword ? (
                    <Button variant="outline" size="sm" onClick={() => onResetPassword(user)}>
                      Restablecer contraseña
                    </Button>
                  ) : null}
                  <Button variant="outline" size="sm" onClick={() => onRemove(user.id)}>
                    Quitar
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
