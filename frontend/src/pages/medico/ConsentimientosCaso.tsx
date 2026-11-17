import { useState } from 'react';
import {
  Badge,
  Button,
  Callout,
  Dialog,
  DialogClose,
  Field,
  Input,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../design-system';
import {
  crearConsentimiento,
  revocarConsentimiento,
  type Consentimiento,
} from '../../api/consentimientos';

const BASES: Record<string, string> = {
  atencion_de_salud: 'Atención de salud',
  consentimiento: 'Consentimiento informado',
  investigacion_con_anonimizacion: 'Investigación con anonimización',
};

interface ConsentimientosCasoProps {
  casoId: string;
  consentimientos: Consentimiento[];
  onCambio: () => void;
}

/** Consentimientos del caso: registrar, listar y revocar con efecto inmediato. */
export function ConsentimientosCaso({
  casoId,
  consentimientos,
  onCambio,
}: ConsentimientosCasoProps) {
  const [dialogo, setDialogo] = useState(false);
  const [baseLegal, setBaseLegal] = useState('atencion_de_salud');
  const [version, setVersion] = useState('v1');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registrar = async () => {
    setGuardando(true);
    setError(null);
    try {
      await crearConsentimiento(casoId, baseLegal, version.trim());
      setDialogo(false);
      onCambio();
    } catch {
      setError('No se pudo registrar el consentimiento. Revisa la versión del texto.');
    } finally {
      setGuardando(false);
    }
  };

  const revocar = async (id: string) => {
    setError(null);
    try {
      await revocarConsentimiento(casoId, id);
      onCambio();
    } catch {
      setError('No se pudo revocar el consentimiento.');
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Consentimiento</h2>
        <Button variant="outline" size="sm" onClick={() => setDialogo(true)}>
          Registrar consentimiento
        </Button>
      </div>
      {error ? (
        <Callout tone="danger" title="Error" role="alert">
          {error}
        </Callout>
      ) : null}
      {consentimientos.length === 0 ? (
        <Callout tone="warning" title="Sin consentimiento registrado">
          Registra el consentimiento de atención de salud para poder analizar las ecografías.
        </Callout>
      ) : (
        <div className="overflow-hidden rounded-panel border border-border">
          <Table caption="Consentimientos del caso">
            <TableHeader>
              <TableRow>
                <TableHead>Finalidad</TableHead>
                <TableHead>Texto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consentimientos.map((consentimiento) => (
                <TableRow key={consentimiento.id}>
                  <TableCell>
                    {BASES[consentimiento.base_legal] ?? consentimiento.base_legal}
                  </TableCell>
                  <TableCell>{consentimiento.version_texto}</TableCell>
                  <TableCell>
                    <Badge tone={consentimiento.vigente ? 'success' : 'neutral'}>
                      {consentimiento.vigente ? 'Vigente' : 'Revocado'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {consentimiento.vigente ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void revocar(consentimiento.id)}
                      >
                        Revocar
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Dialog
        open={dialogo}
        onOpenChange={setDialogo}
        title="Registrar consentimiento"
        description="El retiro tiene efecto inmediato y bloquea la inferencia."
        footer={
          <>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={() => void registrar()} loading={guardando} disabled={!version.trim()}>
              Registrar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Finalidad" required>
            <Select value={baseLegal} onChange={(event) => setBaseLegal(event.currentTarget.value)}>
              {Object.entries(BASES).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Versión del texto firmado" required>
            <Input value={version} onChange={(event) => setVersion(event.currentTarget.value)} />
          </Field>
        </div>
      </Dialog>
    </section>
  );
}
