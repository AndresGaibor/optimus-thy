import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../../design-system/components/atoms/Button';
import { Spinner } from '../../design-system/components/atoms/Spinner';
import { Callout } from '../../design-system/components/molecules/Callout';
import { EmptyState } from '../../design-system/components/molecules/EmptyState';
import { PageHeader } from '../../design-system/components/molecules/PageHeader';
import { Toast } from '../../design-system/components/molecules/Toast';
import { guardarMatriz, obtenerMatriz, type MatrizRoles, type RolMatriz } from '../../api/roles';
import { RolesTabla } from './RolesTabla';
import { RolesGuardado } from './RolesGuardado';

type Seleccion = Record<string, string[]>;

function aSeleccion(roles: RolMatriz[]): Seleccion {
  return Object.fromEntries(roles.map((rol) => [rol.id, [...rol.permisos]]));
}

export function RolesPage() {
  const [matriz, setMatriz] = useState<MatrizRoles | null>(null);
  const [original, setOriginal] = useState<Seleccion>({});
  const [seleccion, setSeleccion] = useState<Seleccion>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [conflicto, setConflicto] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    setConflicto(false);
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

  const cambios = useMemo(() => {
    let total = 0;
    for (const rol of matriz?.roles ?? []) {
      const antes = new Set(original[rol.id] ?? []);
      const ahora = new Set(seleccion[rol.id] ?? []);
      for (const codigo of new Set([...antes, ...ahora])) {
        if (antes.has(codigo) !== ahora.has(codigo)) total += 1;
      }
    }
    return total;
  }, [matriz, original, seleccion]);

  const hayCambios = cambios > 0;

  useEffect(() => {
    if (!hayCambios) return;
    const avisar = (evento: BeforeUnloadEvent) => {
      evento.preventDefault();
      evento.returnValue = '';
    };
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [hayCambios]);

  const alternar = useCallback((rolId: string, codigo: string) => {
    setSeleccion((previo) => {
      const actuales = previo[rolId] ?? [];
      const siguientes = actuales.includes(codigo)
        ? actuales.filter((valor) => valor !== codigo)
        : [...actuales, codigo];
      return { ...previo, [rolId]: siguientes };
    });
    setAviso(null);
    setError(null);
    setConflicto(false);
  }, []);

  const guardar = useCallback(async () => {
    if (!matriz || !hayCambios || guardando) return;
    const editados = matriz.roles.filter((rol) => {
      const antes = [...(original[rol.id] ?? [])].sort();
      const ahora = [...(seleccion[rol.id] ?? [])].sort();
      return antes.length !== ahora.length || antes.some((valor, i) => valor !== ahora[i]);
    });

    setGuardando(true);
    setError(null);
    setConflicto(false);
    const res = await guardarMatriz({
      estado: Object.fromEntries(editados.map((rol) => [rol.id, seleccion[rol.id] ?? []])),
      esperado: Object.fromEntries(editados.map((rol) => [rol.id, original[rol.id] ?? []])),
    });
    setGuardando(false);

    if (!res.ok) {
      if (res.status === 409) {
        setConflicto(true);
      } else {
        setError(
          res.status === 422
            ? 'La matriz no se guardó: revisa los permisos marcados.'
            : 'No se pudieron guardar los cambios. Reintenta la operación.',
        );
      }
      return;
    }

    const roles = res.data.roles ?? [];
    setMatriz({ roles, permisos: res.data.permisos ?? [] });
    setOriginal(aSeleccion(roles));
    setSeleccion(aSeleccion(roles));
    setAviso('Cambios guardados. La bitácora registró la nueva matriz.');
  }, [matriz, original, seleccion, hayCambios, guardando]);

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
          <div className="flex flex-col items-start gap-3">
            <p>{error}</p>
            <Button variant="secondary" size="sm" onClick={() => void cargar()}>
              Reintentar
            </Button>
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
      <RolesTabla
        roles={matriz.roles}
        permisos={matriz.permisos}
        seleccion={seleccion}
        onAlternar={alternar}
      />
    );
  }, [cargando, error, matriz, seleccion, alternar, cargar]);

  return (
    <section className="mx-auto w-full max-w-(--content-max-width) space-y-6 px-4 py-6">
      <PageHeader
        title="Roles y permisos"
        description="Matriz de mínimo privilegio por rol. Los permisos del administrador son fijos y cada cambio guardado queda en la bitácora."
      />

      {error && matriz ? (
        <Callout tone="danger" role="alert">
          {error}
        </Callout>
      ) : null}

      {conflicto ? (
        <Callout tone="warning" role="alert" title="La matriz cambió mientras editabas">
          <div className="flex flex-col gap-3">
            <p>
              Otro administrador guardó permisos antes que tú. Tus cambios no se aplicaron y siguen
              en pantalla.
            </p>
            <div>
              <Button variant="secondary" size="sm" onClick={() => void cargar()}>
                Recargar matriz
              </Button>
            </div>
          </div>
        </Callout>
      ) : null}

      {aviso ? <Toast title={aviso} tone="success" /> : null}

      {contenido}

      {hayCambios ? (
        <RolesGuardado
          cambios={cambios}
          guardando={guardando}
          onDescartar={() => {
            setSeleccion(original);
            setAviso(null);
            setError(null);
            setConflicto(false);
          }}
          onGuardar={() => void guardar()}
        />
      ) : null}
    </section>
  );
}
