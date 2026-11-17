import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import type { OrdenUsuarios, Usuario } from '../../api/usuarios';
import { Button } from '../../design-system/components/atoms/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../design-system/components/atoms/Table';
import { ActionsMenu } from '../../design-system/components/molecules/ActionsMenu';
import { Callout } from '../../design-system/components/molecules/Callout';
import { StatusBadge } from '../../design-system/components/molecules/StatusBadge';
import { obtenerEtiquetaRol } from './etiquetas-rol';
import { EncabezadoOrdenable, type CampoOrdenable } from './UsuariosEncabezadoOrdenable';

export interface UsuariosTablaProps {
  usuarios: Usuario[];
  orden: OrdenUsuarios;
  direccion: 'asc' | 'desc';
  onOrden: (campo: CampoOrdenable) => void;
  onCambiarEstado: (usuario: Usuario) => void;
  onEditar: (usuario: Usuario) => void;
  onRoles: (usuario: Usuario) => void;
  errorEstado: string | null;
  avisoEstado: string;
  /** Correo de la cuenta con la sesión activa; no puede desactivarse a sí misma. */
  correoSesion?: string | undefined;
  /** Identificador del usuario con un cambio de estado en curso. */
  cambiandoEstadoId?: string | null;
}

/** Roles como texto: cada uno es un elemento propio, así el salto ocurre entre roles. */
function RolesTexto({ roles, className }: { roles: string[]; className?: string }) {
  return (
    <span className={className ?? 'flex flex-wrap gap-x-2 gap-y-1 text-sm text-foreground'}>
      {roles.map((rol, indice) => (
        <span key={rol} className="whitespace-nowrap">
          {indice > 0 ? <span aria-hidden>· </span> : null}
          {rol}
        </span>
      ))}
    </span>
  );
}

export function UsuariosTabla({
  usuarios,
  orden,
  direccion,
  onOrden,
  onCambiarEstado,
  onEditar,
  onRoles,
  errorEstado,
  avisoEstado,
  correoSesion,
  cambiandoEstadoId = null,
}: UsuariosTablaProps) {
  const [copiado, setCopiado] = useState<string | null>(null);

  const copiarCorreo = async (correo: string) => {
    try {
      await navigator.clipboard.writeText(correo);
      setCopiado(correo);
      window.setTimeout(() => setCopiado((actual) => (actual === correo ? null : actual)), 2000);
    } catch {
      setCopiado(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {errorEstado ? (
        <Callout tone="danger" role="alert" title="No se cambió el estado">
          <p>{errorEstado}</p>
        </Callout>
      ) : null}
      <p role="status" className="sr-only">
        {copiado ? `Correo ${copiado} copiado.` : avisoEstado}
      </p>
      <Table caption="Listado de usuarios" className="table-fixed">
        <TableHeader>
          <TableRow>
            <EncabezadoOrdenable
              campo="nombre"
              etiqueta="Usuario"
              orden={orden}
              direccion={direccion}
              onOrden={onOrden}
              className="w-1/3"
            />
            <TableHead className="hidden w-48 sm:table-cell">Institución</TableHead>
            <TableHead className="hidden w-1/5 sm:table-cell">Roles</TableHead>
            <EncabezadoOrdenable
              campo="estado"
              etiqueta="Estado"
              orden={orden}
              direccion={direccion}
              onOrden={onOrden}
              className="hidden w-24 sm:table-cell"
            />
            <TableHead className="w-1/4 px-2 sm:px-4">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usuarios.map((usuario) => {
            const esLaPropiaCuenta = Boolean(correoSesion && usuario.correo === correoSesion);
            const roles = (usuario.roles || []).map(obtenerEtiquetaRol);
            const copiadoAqui = copiado === usuario.correo;
            return (
              <TableRow key={usuario.id}>
                <TableCell className="max-w-0 py-4 align-middle">
                  <span
                    className="block truncate font-semibold text-foreground"
                    title={usuario.nombre || 'Sin nombre'}
                  >
                    {usuario.nombre || 'Sin nombre'}
                  </span>
                  <span className="flex min-w-0 items-center gap-1">
                    <span className="truncate text-muted-foreground" title={usuario.correo}>
                      {usuario.correo}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => void copiarCorreo(usuario.correo)}
                      aria-label={`Copiar correo de ${usuario.correo}`}
                      className="size-6 shrink-0 text-muted-foreground"
                    >
                      {copiadoAqui ? (
                        <Check aria-hidden className="size-3.5" />
                      ) : (
                        <Copy aria-hidden className="size-3.5" />
                      )}
                    </Button>
                  </span>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 sm:hidden">
                    <span className="break-words text-sm text-muted-foreground">
                      {usuario.institucion?.nombre || 'Sin institución'}
                    </span>
                    <RolesTexto roles={roles} />
                    <StatusBadge
                      kind="user"
                      status={usuario.activo ? 'Activo' : 'Inactivo'}
                      className="px-1.5 py-0 text-xs"
                    />
                  </div>
                </TableCell>
                <TableCell className="hidden max-w-0 py-4 align-middle sm:table-cell">
                  <span
                    className="block truncate text-foreground"
                    title={usuario.institucion?.nombre || 'Sin institución'}
                  >
                    {usuario.institucion?.nombre || 'Sin institución'}
                  </span>
                </TableCell>
                <TableCell className="hidden py-4 align-middle sm:table-cell">
                  <RolesTexto roles={roles} />
                </TableCell>
                <TableCell className="hidden py-4 align-middle sm:table-cell">
                  <StatusBadge kind="user" status={usuario.activo ? 'Activo' : 'Inactivo'} />
                </TableCell>
                <TableCell className="px-2 py-4 align-middle sm:px-4">
                  <div className="flex flex-wrap items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditar(usuario)}
                      aria-label={`Editar usuario ${usuario.correo}`}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRoles(usuario)}
                      aria-label={`Gestionar roles de ${usuario.correo}`}
                    >
                      Gestionar roles
                    </Button>
                    <ActionsMenu
                      label={`Acciones de ${usuario.correo}`}
                      busy={cambiandoEstadoId === usuario.id}
                      disabled={cambiandoEstadoId === usuario.id}
                      items={[
                        usuario.activo
                          ? {
                              label: 'Desactivar',
                              tone: 'danger',
                              disabled: esLaPropiaCuenta,
                              ...(esLaPropiaCuenta
                                ? { title: 'No puedes desactivar tu propia cuenta' }
                                : {}),
                              onSelect: () => onCambiarEstado(usuario),
                            }
                          : {
                              label: 'Activar',
                              onSelect: () => onCambiarEstado(usuario),
                            },
                      ]}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
