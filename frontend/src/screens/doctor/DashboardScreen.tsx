import { AlertCircle, Brain, Clock, FileText, TrendingUp, Users } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  StatCard,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TiradsBadge,
} from '../../design-system';
import type { DemoInference, DemoPatient, DemoRecord } from '../fixtures/types';
import { DemoRoleLayout } from '../shared/DemoRoleLayout';
import { ScreenFrame } from '../shared/ScreenFrame';
export interface DashboardScreenProps {
  patients: DemoPatient[];
  records: DemoRecord[];
  inferences: DemoInference[];
  onNewInference: () => void;
  onOpenInference: (id: string) => void;
}
export function DashboardScreen({
  patients,
  records,
  inferences,
  onNewInference,
  onOpenInference,
}: DashboardScreenProps) {
  const pending = inferences.filter((x) => x.estado === 'En cola').length;
  const benignos = inferences.filter((x) => x.resultado.toLowerCase().includes('benign')).length;
  const malignos = inferences.filter((x) => x.resultado.toLowerCase().includes('malign')).length;
  const modelos = new Set(inferences.map((x) => x.modelo)).size;
  return (
    <DemoRoleLayout role="medico">
      <ScreenFrame
        title="Dashboard — Médico"
        description="Bienvenido, médico de demostración"
        actions={<Button onClick={onNewInference}>Nueva inferencia</Button>}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Pacientes registrados"
            value={patients.length}
            description="Registrados en el sistema"
            icon={Users}
            tone="info"
          />
          <StatCard
            label="Estudios"
            value={records.length}
            description="Fichas clínicas procesadas"
            icon={FileText}
            tone="info"
          />
          <StatCard
            label="Inferencias"
            value={inferences.length}
            description={`${pending} ${pending === 1 ? 'pendiente' : 'pendientes'}`}
            icon={Brain}
            tone="info"
          />
          <StatCard
            label="Benignos"
            value={benignos}
            description="Por clase"
            icon={TrendingUp}
            tone="success"
          />
          <StatCard
            label="Malignos"
            value={malignos}
            description="Por clase"
            icon={TrendingUp}
            tone="danger"
          />
          <StatCard
            label="Modelos"
            value={modelos}
            description="Activos"
            icon={Brain}
            tone="info"
          />
          <StatCard
            label="Pendientes"
            value={pending}
            description="En cola de revisión"
            icon={Clock}
            tone="warning"
          />
        </div>
        {pending > 0 && (
          <Card>
            <CardHeader>
              <CardTitle as="h2" className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Alertas pendientes
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {pending === 1
                  ? '1 inferencia pendiente de revisión.'
                  : `${pending} inferencias pendientes de revisión.`}
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Hay{' '}
                {pending === 1
                  ? '1 caso en cola que requiere atención profesional.'
                  : `${pending} casos en cola que requieren atención profesional.`}
              </p>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle as="h2">Inferencias recientes</CardTitle>
            <p className="text-sm text-muted-foreground">Últimos resultados de modelos de IA</p>
          </CardHeader>
          <CardContent>
            {inferences.length === 0 ? (
              <EmptyState
                title="No hay inferencias aún"
                description="Envía un estudio para comenzar."
              />
            ) : (
              <Table caption="Últimas cinco inferencias registradas">
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Confianza</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inferences.slice(0, 5).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => onOpenInference(item.id)}
                          className="h-auto p-0 font-medium text-foreground no-underline hover:underline"
                        >
                          {item.pacienteNombre}
                        </Button>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.modelo}</TableCell>
                      <TableCell>{item.resultado}</TableCell>
                      <TableCell>{item.confianza}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <StatusBadge kind="inference" status={item.estado} />
                          {item.tiRads !== '—' && <TiradsBadge value={item.tiRads} />}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.fecha}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </ScreenFrame>
    </DemoRoleLayout>
  );
}
