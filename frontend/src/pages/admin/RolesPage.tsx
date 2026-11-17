import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../../design-system/components/atoms/Button';
import { Spinner } from '../../design-system/components/atoms/Spinner';
import { Switch } from '../../design-system/components/atoms/Switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../design-system/components/atoms/Table';
import { Callout } from '../../design-system/components/molecules/Callout';
import { EmptyState } from '../../design-system/components/molecules/EmptyState';
import { PageHeader } from '../../design-system/components/molecules/PageHeader';
import { Toast } from '../../design-system/components/molecules/Toast';
import {
  actualizarPermisosRol,
  obtenerMatriz,
  type MatrizRoles,
  type RolMatriz,
} from '../../api/roles';
import { mapBackendRoleToUi, ROLE_LABEL } from '../../session/roles';

type Seleccion = Record<string, string[]>;

function etiquetaRol(rol: RolMatriz): string {
  const rolUi = mapBackendRoleToUi(rol.nombre);
  return rolUi ? ROLE_LABEL[rolUi] : rol.nombre;
}

function aSeleccion(roles: RolMatriz[]): Seleccion {
  return Object.fromEntries(roles.map((rol) => [rol.id, [...rol.permisos]]));
}

function mismasSelecciones(a: Seleccion, b: Seleccion): boolean {
  const clavesA = Object.keys(a);
  const clavesB = Object.keys(b);
  if (clavesA.length !== clavesB.length) return false;
  return clavesA.every((clave) => {
    const listaA = [...(a[clave] ?? [])].sort();
    const listaB = [...(b[clave] ?? [])].sort();
    return listaA.length === listaB.length && listaA.every((valor, i) => valor === listaB[i]);
  });
}

export function RolesPage() {
  const [matriz, setMatriz] = useState<MatrizRoles | null>(null);
  const [original, setOriginal] = useState<Seleccion>({});
  const [seleccion, setSeleccion] = useState<Seleccion>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    const res = await obtenerMatriz();
    if (!res.ok) {
      setMatriz(null);
      setError(
        res.status === 403
          ? 'Tu rol no permite ver la matriz de permisos.'
          : 'No se pudo cargar la matriz de permisos. Reintenta la operación.',
      );
      setCargando(false);
      return;
    }
    const roles = res.data.roles ?? [];
    setMatriz({ roles, permisos: res.data.permisos ?? [] });
    const inicial = aSeleccion(roles);
    setOriginal(inicial);
    setSeleccion(inicial);
    setCargando(false);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const hayCambios = useMemo(() => !mismasSelecciones(original, seleccion), [original, seleccion]);

  const alternar = useCallback((rolId: string, codigo: string) => {
    setSeleccion((previo) => {
      const actuales = previo[rolId] ?? [];
      const siguientes = actuales.includes(codigo)
        ? actuales.filter((valor) => valor !== codigo)
        : [...actuales, codigo];
      return { ...previo, [rolId]: siguientes };
    });
    setAviso(null);
  }, []);

  const guardar = useCallback(async () => {
    if (!matriz) return;
    const rolesEditados = matriz.roles.filter((rol) => {
      const antes = original[rol.id] ?? [];
      const ahora = seleccion[rol.id] ?? [];
      return !mismasSelecciones({ [rol.id]: antes }, { [rol.id]: ahora });
    });

    if (rolesEditados.length === 0) return;

    setGuardando(true);
    setError(null);
    for (const rol of rolesEditados) {
      const res = await actualizarPermisosRol(rol.id, seleccion[rol.id] ?? []);
      if (!res.ok) {
        setGuardando(false);
        setError(
          res.status === 422
            ? 'La matriz no se guardó: revisa los permisos marcados.'
            : 'No se pudieron guardar los cambios. Reintenta la operación.',
        );
        return;
      }
    }
    setGuardando(false);
    setAviso('Cambios guardados. La bitácora registró la nueva matriz.');
    await cargar();
  }, [matriz, original, seleccion, cargar]);

  const contenido = useMemo(() => {
    if (cargando) {
      return (
        <div className="flex items-center justify-center py-12">
          <Spinner aria-label="Cargando matriz de permisos" />
        </div>
      );
    }

    if (error && !matriz) {
      return (
        <Callout tone="danger" title="Error">
          <div className="flex flex-col gap-3">
            <p>{error}</p>
            <div>
              <Button variant="secondary" size="sm" onClick={() => void cargar()}>
                Reintentar
              </Button>
            </div>
          </div>
        </Callout>
      );
    }

    if (!matriz || matriz.roles.length === 0) {
      return (
        <EmptyState
          as="h2"
          title="Sin roles"
          description="No hay roles configurados en el sistema."
        />
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table caption="Matriz de permisos por rol">
          <TableHeader>
            <TableRow>
              <TableHead>Permiso</TableHead>
              {matriz.roles.map((rol) => (
                <TableHead key={rol.id}>{etiquetaRol(rol)}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {matriz.permisos.map((permiso) => (
              <TableRow key={permiso.codigo}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{permiso.codigo}</span>
                    {permiso.descripcion ? (
                      <span className="text-sm text-muted-foreground">{permiso.descripcion}</span>
                    ) : null}
                  </div>
                </TableCell>
                {matriz.roles.map((rol) => {
                  const marcado = (seleccion[rol.id] ?? []).includes(permiso.codigo);
                  const aplica = (rol.asignables ?? []).includes(permiso.codigo);
                  return (
                    <TableCell key={`${rol.id}-${permiso.codigo}`}>
                      {aplica ? (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={marcado}
                            aria-label={`Permiso ${permiso.codigo} para ${etiquetaRol(rol)}`}
                            onCheckedChange={() => alternar(rol.id, permiso.codigo)}
                          />
                          <span className="text-sm text-muted-foreground">
                            {marcado ? 'Concedido' : 'Denegado'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          <span className="sr-only">No aplica a {etiquetaRol(rol)}</span>
                          <span aria-hidden="true">—</span>
                        </span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }, [cargando, error, matriz, seleccion, alternar, cargar]);

  return (
    <section className="mx-auto w-full max-w-(--content-max-width) space-y-6 px-4 py-6">
      <PageHeader
        title="Roles y permisos"
        description="Matriz de mínimo privilegio por rol. Cada cambio queda registrado en la bitácora."
        actions={
          <Button onClick={() => void guardar()} disabled={!hayCambios || guardando}>
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        }
      />

      <Callout tone="info" title="Mínimo privilegio">
        Concede solo los permisos que el rol necesita. Cada rol muestra únicamente los permisos de
        su ámbito; el rol administrador tiene permisos fijos y no se edita en esta matriz.
      </Callout>

      {error && matriz ? (
        <Callout tone="danger" role="alert">
          {error}
        </Callout>
      ) : null}

      {aviso ? <Toast title={aviso} tone="success" /> : null}

      {contenido}
    </section>
  );
}
