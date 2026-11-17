import { Check, Copy, Pencil, ShieldCheck, UserCheck, UserX } from 'lucide-react';
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
    <span className={className ?? 'flex flex-wrap gap-x-3 gap-y-1 text-sm text-foreground'}>
      {roles.map((rol) => (
        <span key={rol} className="whitespace-nowrap">
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
            />
            <TableHead className="hidden w-44 sm:table-cell">Institución</TableHead>
            <TableHead className="hidden w-56 sm:table-cell">Roles</TableHead>
            <EncabezadoOrdenable
              campo="estado"
              etiqueta="Estado"
              orden={orden}
              direccion={direccion}
              onOrden={onOrden}
              className="hidden w-24 sm:table-cell"
            />
            <TableHead className="w-96 px-2 sm:px-4">Acciones</TableHead>
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
                  <span className="group flex min-w-0 items-center gap-1">
                    <span className="truncate text-muted-foreground" title={usuario.correo}>
                      {usuario.correo}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => void copiarCorreo(usuario.correo)}
                      aria-label={`Copiar correo de ${usuario.correo}`}
                      className="size-6 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100"
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
                  <div className="flex flex-nowrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditar(usuario)}
                      aria-label={`Editar usuario ${usuario.correo}`}
                      className="whitespace-nowrap"
                    >
                      <Pencil aria-hidden className="size-4" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRoles(usuario)}
                      aria-label={`Gestionar roles de ${usuario.correo}`}
                      className="whitespace-nowrap"
                    >
                      <ShieldCheck aria-hidden className="size-4" />
                      Roles
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCambiarEstado(usuario)}
                      disabled={esLaPropiaCuenta || cambiandoEstadoId === usuario.id}
                      title={esLaPropiaCuenta ? 'No puedes desactivar tu propia cuenta' : undefined}
                      aria-label={`${usuario.activo ? 'Desactivar' : 'Activar'} usuario ${usuario.correo}`}
                      className="whitespace-nowrap"
                    >
                      {usuario.activo ? (
                        <UserX aria-hidden className="size-4" />
                      ) : (
                        <UserCheck aria-hidden className="size-4" />
                      )}
                      {usuario.activo ? 'Desactivar' : 'Activar'}
                    </Button>
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
