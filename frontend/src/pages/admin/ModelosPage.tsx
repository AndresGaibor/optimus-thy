import { useCallback, useEffect, useState } from 'react';
import { activarModelo, listarModelos, subirModelo, type ModeloIA } from '../../api/modelos';
import {
  Button,
  Callout,
  Dialog,
  DialogClose,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Spinner,
} from '../../design-system';
import { ModelosTabla } from './ModelosTabla';

export function ModelosPage() {
  const [modelos, setModelos] = useState<ModeloIA[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [subidaAbierta, setSubidaAbierta] = useState(false);
  const [modeloAActivar, setModeloAActivar] = useState<ModeloIA | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [nombre, setNombre] = useState('');
  const [version, setVersion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [progreso, setProgreso] = useState<number | null>(null);

  const cargarModelos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setModelos(await listarModelos());
    } catch {
      setError('No se pudieron cargar los modelos. Inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarModelos();
  }, [cargarModelos]);

  const subir = async () => {
    if (!archivo || !nombre.trim() || !version.trim()) return;
    setGuardando(true);
    setError(null);
    setProgreso(0);
    try {
      const modelo = await subirModelo(archivo, nombre.trim(), version.trim(), setProgreso);
      setModelos((actuales) => [modelo, ...actuales]);
      setAviso(`Se subió ${modelo.nombre} ${modelo.version}.`);
      setSubidaAbierta(false);
      setArchivo(null);
      setNombre('');
      setVersion('');
    } catch (fallo) {
      setError(
        fallo instanceof Error
          ? fallo.message
          : 'No se pudo subir el archivo ZIP. Comprueba los datos y vuelve a intentarlo.',
      );
    } finally {
      setGuardando(false);
      setProgreso(null);
    }
  };

  const activar = async () => {
    if (!modeloAActivar) return;
    setGuardando(true);
    setError(null);
    try {
      const activado = await activarModelo(modeloAActivar.id);
      setModelos((actuales) =>
        actuales.map((modelo) => ({ ...modelo, activo: modelo.id === activado.id })),
      );
      setAviso(`Se activó ${activado.nombre} ${activado.version}.`);
      setModeloAActivar(null);
    } catch {
      setError('No se pudo activar el modelo. Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="flex flex-col gap-6">
      <PageHeader
        title="Modelos de IA"
        description="Administra las versiones disponibles y elige cuál está activa."
        actions={
          <Button
            onClick={() => {
              setAviso(null);
              setSubidaAbierta(true);
            }}
          >
            Subir modelos
          </Button>
        }
      />
      {error ? (
        <Callout tone="danger" title="Error" role="alert">
          {error}
          <Button variant="outline" size="sm" onClick={() => void cargarModelos()}>
            Reintentar
          </Button>
        </Callout>
      ) : null}
      {aviso ? (
        <Callout tone="success" title="Listo" role="status">
          {aviso}
        </Callout>
      ) : null}
      {cargando ? (
        <Spinner size="lg" label="Cargando modelos de IA" />
      ) : modelos.length === 0 ? (
        <EmptyState
          as="h2"
          title="Sin modelos"
          description="Sube un archivo ZIP con los pesos para empezar."
          action={<Button onClick={() => setSubidaAbierta(true)}>Subir modelos</Button>}
        />
      ) : (
        <ModelosTabla modelos={modelos} onActivar={setModeloAActivar} />
      )}
      <Dialog
        open={subidaAbierta}
        onOpenChange={setSubidaAbierta}
        title="Subir modelos"
        description="Selecciona el ZIP que contiene los tres pesos del modelo."
        footer={
          <>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              onClick={() => void subir()}
              disabled={!archivo || !nombre.trim() || !version.trim()}
              loading={guardando}
            >
              Subir modelos
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {progreso !== null ? (
            <p role="status" className="text-sm text-muted-foreground">
              Subiendo… {Math.round(progreso * 100)} % de {archivo ? archivo.name : 'archivo'}
            </p>
          ) : null}
          <Field label="Archivo ZIP" required>
            <Input
              type="file"
              accept=".zip,application/zip"
              onChange={(event) => setArchivo(event.currentTarget.files?.[0] ?? null)}
            />
          </Field>
          <Field label="Nombre" required>
            <Input value={nombre} onChange={(event) => setNombre(event.currentTarget.value)} />
          </Field>
          <Field label="Versión" required>
            <Input value={version} onChange={(event) => setVersion(event.currentTarget.value)} />
          </Field>
        </div>
      </Dialog>
      <Dialog
        open={Boolean(modeloAActivar)}
        onOpenChange={(open) => {
          if (!open) setModeloAActivar(null);
        }}
        title="Activar modelo"
        description={
          modeloAActivar
            ? `¿Quieres activar ${modeloAActivar.nombre} ${modeloAActivar.version}?`
            : undefined
        }
        footer={
          <>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={() => void activar()} loading={guardando}>
              Confirmar activación
            </Button>
          </>
        }
      />
    </main>
  );
}
