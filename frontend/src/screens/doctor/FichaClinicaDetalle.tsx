import { useState } from 'react';
import {
  Badge,
  Button,
  Callout,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogClose,
  Field,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '../../design-system';
import { DemoRoleLayout } from '../shared/DemoRoleLayout';
import { ScreenFrame } from '../shared/ScreenFrame';
import type { FichaCompleta } from '../fixtures/fichas-extra';

export interface FichaClinicaDetalleProps {
  ficha: FichaCompleta;
  puedeReabrir?: boolean;
  onEditar?: () => void;
  onCerrar?: () => void;
  onReabrir?: (motivo: string) => void;
}

export function FichaClinicaDetalle({
  ficha,
  puedeReabrir = true,
  onEditar,
  onCerrar,
  onReabrir,
}: FichaClinicaDetalleProps) {
  const [reabrirAbierto, setReabrirAbierto] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [errorMotivo, setErrorMotivo] = useState<string>();
  const { registro } = ficha;
  const confirmarReapertura = () => {
    if (!motivo.trim()) {
      setErrorMotivo('El motivo es obligatorio para reabrir la ficha.');
      return;
    }
    setErrorMotivo(undefined);
    onReabrir?.(motivo.trim());
    setReabrirAbierto(false);
  };
  return (
    <DemoRoleLayout role="medico">
      <ScreenFrame
        title={`Ficha ${registro.id}`}
        description={`${registro.pacienteNombre} · ${registro.tipo} · ${registro.fecha}`}
        actions={
          !ficha.cerrada ? (
            <>
              <Button variant="outline" onClick={onEditar}>
                Editar
              </Button>
              <Button onClick={onCerrar}>Cerrar ficha</Button>
            </>
          ) : puedeReabrir ? (
            <Button onClick={() => setReabrirAbierto(true)}>Reabrir</Button>
          ) : undefined
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge kind="record" status={registro.estado} />
          {ficha.cerrada ? <Badge tone="neutral">Cerrada</Badge> : null}
          <span className="text-sm text-muted-foreground">Profesional: {ficha.profesional}</span>
        </div>
        {ficha.cerrada ? (
          <Callout tone="warning" title="Ficha cerrada">
            La edición está deshabilitada porque la ficha fue cerrada
            {ficha.cerradaEn ? ` el ${ficha.cerradaEn}` : ''}.{' '}
            {ficha.cierreMotivo ? `Motivo: ${ficha.cierreMotivo}` : ''}
            {puedeReabrir
              ? ' Puedes reabrirla con permiso; la reapertura queda registrada.'
              : ' No tienes permiso para reabrirla.'}
          </Callout>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle as="h2">Secciones de la ficha</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="consulta">
              <TabsList aria-label="Secciones de la ficha clínica">
                {ficha.secciones.map((s) => (
                  <TabsTrigger key={s.id} value={s.id}>
                    {s.titulo}
                  </TabsTrigger>
                ))}
              </TabsList>
              {ficha.secciones.map((s) => (
                <TabsContent key={s.id} value={s.id}>
                  <Table caption={`Sección ${s.titulo}`}>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campo</TableHead>
                        <TableHead>Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {s.campos.map((c) => (
                        <TableRow key={c.etiqueta}>
                          <TableCell>{c.etiqueta}</TableCell>
                          <TableCell>{c.valor}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
        <Dialog
          open={reabrirAbierto}
          onOpenChange={setReabrirAbierto}
          title="Reabrir ficha"
          description="La reapertura requiere un motivo y queda registrada en el historial."
          footer={
            <>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={confirmarReapertura}>Confirmar reapertura</Button>
            </>
          }
        >
          <div className="space-y-4">
            <Callout tone="info" title="Registro de reapertura">
              Ficha {registro.id} · solicitada por Médico de demostración. El motivo quedará en el
              historial de cambios.
            </Callout>
            <Field label="Motivo de reapertura" required error={errorMotivo}>
              <Textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Describe por qué se reabre la ficha"
              />
            </Field>
          </div>
        </Dialog>
      </ScreenFrame>
    </DemoRoleLayout>
  );
}
