import { useState, type ReactNode } from 'react';
import { Brain, FileText, Images } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ScanViewport,
  StatCard,
  StatusBadge,
  SupportNotice,
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
  Timeline,
  TiradsBadge,
} from '../../design-system';
import type {
  DemoImage,
  DemoInference,
  DemoLab,
  DemoPatient,
  DemoRecord,
  DemoTimelineEvent,
} from '../fixtures/types';
import { DemoRoleLayout } from '../shared/DemoRoleLayout';
import { ScreenFrame } from '../shared/ScreenFrame';
export interface PatientDetailScreenProps {
  patient: DemoPatient;
  labs: DemoLab[];
  images: DemoImage[];
  records: DemoRecord[];
  inferences: DemoInference[];
  timeline: DemoTimelineEvent[];
  onBack: () => void;
  onViewRecord: (id: string) => void;
  onViewInference: (id: string) => void;
}
export function PatientDetailScreen({
  patient,
  labs: allLabs,
  images: allImages,
  records: allRecords,
  inferences: allInferences,
  timeline: allTimeline,
  onBack,
  onViewRecord,
  onViewInference,
}: PatientDetailScreenProps) {
  // Todas las colecciones clínicas se restringen al paciente activo.
  const labs = allLabs.filter((x) => x.pacienteId === patient.id);
  const images = allImages.filter((x) => x.pacienteId === patient.id);
  const records = allRecords.filter((x) => x.pacienteId === patient.id);
  const inferences = allInferences.filter((x) => x.pacienteId === patient.id);
  const timeline = allTimeline.filter((x) => x.pacienteId === patient.id);
  const [tab, setTab] = useState('perfil');
  const events = timeline.map((x) => ({
    id: x.id,
    title: x.titulo,
    description: x.detalle,
    timestamp: x.fecha,
  }));
  const normal = (value: string) => value.toLowerCase().includes('sin nódulo');
  return (
    <DemoRoleLayout role="medico">
      <ScreenFrame
        title={patient.nombre}
        description={`${patient.id} · Historia ${patient.historia} · Institución demo`}
        actions={
          <Button variant="outline" onClick={onBack}>
            Volver a pacientes
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle as="h2">Datos del paciente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>Edad: {patient.edad}</p>
              <p>
                Género:{' '}
                {patient.sexo === 'F' ? 'Femenino' : patient.sexo === 'M' ? 'Masculino' : 'Otro'}
              </p>
              <p>Última consulta: {patient.ultimaConsulta}</p>
            </CardContent>
          </Card>
          <StatCard
            label="Estudios"
            value={records.length}
            description="Fichas clínicas"
            icon={FileText}
            tone="info"
          />
          <StatCard
            label="Imágenes"
            value={images.length}
            description="Estudios de imagen"
            icon={Images}
            tone="info"
          />
          <StatCard
            label="Inferencias"
            value={inferences.length}
            description="Resultados de IA"
            icon={Brain}
            tone="info"
          />
        </div>
        <SupportNotice context="inferencia" />
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="perfil">Perfil tiroideo</TabsTrigger>
            <TabsTrigger value="laboratorios">Laboratorios</TabsTrigger>
            <TabsTrigger value="imagenes">Imágenes</TabsTrigger>
            <TabsTrigger value="fichas">Fichas clínicas</TabsTrigger>
            <TabsTrigger value="inferencias">Inferencias IA</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>
          <TabsContent value="perfil">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle as="h2">Resumen de perfil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p>
                    Edad: {patient.edad} · Sexo registrado: {patient.sexo}
                  </p>
                  <p>Última consulta: {patient.ultimaConsulta}</p>
                  <p>Institución: {patient.institucion}</p>
                  <TiradsBadge value={inferences[0]?.tiRads ?? '—'} />
                  <p className="text-sm text-muted-foreground">
                    Los resultados de apoyo requieren revisión profesional.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle as="h2">Último resultado de apoyo</CardTitle>
                </CardHeader>
                <CardContent>
                  {inferences[0] ? (
                    <>
                      <p className="font-medium">
                        {normal(inferences[0].resultado) ? (
                          <>
                            <strong>Normal:</strong> sin nódulo detectado.
                          </>
                        ) : (
                          inferences[0].resultado
                        )}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {inferences[0].id} · {inferences[0].fecha}
                      </p>
                      <Button
                        className="mt-4"
                        variant="outline"
                        onClick={() => onViewInference(inferences[0]!.id)}
                      >
                        Ver revisión
                      </Button>
                    </>
                  ) : (
                    <EmptyState title="Sin inferencias" />
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle as="h2">Ilustración de referencia</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScanViewport label="Ilustración sintética — no es una imagen clínica" />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Representación vectorial de demostración.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="laboratorios">
            <Card>
              <CardContent className="p-5">
                <Table caption="Resultados de laboratorio sintéticos">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>TSH</TableHead>
                      <TableHead>T3</TableHead>
                      <TableHead>T4</TableHead>
                      <TableHead>Origen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {labs.map((x) => (
                      <TableRow key={x.id}>
                        <TableCell>{x.fecha}</TableCell>
                        <TableCell>{x.tsh}</TableCell>
                        <TableCell>{x.t3}</TableCell>
                        <TableCell>{x.t4}</TableCell>
                        <TableCell>{x.laboratorio}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="imagenes">
            {images.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {images.map((x) => (
                  <Card key={x.id}>
                    <CardContent className="space-y-3 p-4">
                      {x.src ? (
                        <img
                          src={x.src}
                          alt={`${x.tipo} ${x.subtipo} de ${x.pacienteNombre}`}
                          className="aspect-[4/3] w-full rounded-card border border-border object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <ScanViewport label={`${x.id} · ${x.subtipo}`} />
                      )}
                      <p className="font-medium">
                        {x.tipo} · {x.fecha}
                      </p>
                      <p className="text-sm text-muted-foreground">{x.hallazgo}</p>
                      <TiradsBadge value={x.tiRads} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Sin imágenes"
                description="Este paciente no tiene imágenes sintéticas."
              />
            )}
          </TabsContent>
          <TabsContent value="fichas">
            <DataRows
              caption="Fichas clínicas sintéticas"
              rows={records.map((x) => (
                <TableRow key={x.id}>
                  <TableCell>{x.id}</TableCell>
                  <TableCell>{x.tipo}</TableCell>
                  <TableCell>{x.fecha}</TableCell>
                  <TableCell>
                    <StatusBadge kind="record" status={x.estado} />
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => onViewRecord(x.id)}>
                      Ver ficha
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            />
          </TabsContent>
          <TabsContent value="inferencias">
            <DataRows
              caption="Inferencias sintéticas"
              rows={inferences.map((x) => (
                <TableRow key={x.id}>
                  <TableCell>{x.id}</TableCell>
                  <TableCell>{x.modelo}</TableCell>
                  <TableCell>
                    {normal(x.resultado) ? (
                      <>
                        <strong>Normal:</strong> sin nódulo detectado.
                      </>
                    ) : (
                      x.resultado
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge kind="inference" status={x.estado} />
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => onViewInference(x.id)}>
                      Revisar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            />
          </TabsContent>
          <TabsContent value="historial">
            <Timeline items={events} label="Historial sintético del paciente" />
          </TabsContent>
        </Tabs>
      </ScreenFrame>
    </DemoRoleLayout>
  );
}
function DataRows({ caption, rows }: { caption: string; rows: ReactNode[] }) {
  return (
    <Card>
      <CardContent className="overflow-x-auto p-5">
        <Table caption={caption}>
          <TableHeader>
            <TableRow>
              <TableHead>Referencia</TableHead>
              <TableHead>Detalle</TableHead>
              <TableHead>Fecha / resultado</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{rows}</TableBody>
        </Table>
        {rows.length === 0 && (
          <EmptyState
            title="Sin registros"
            description="Este paciente no tiene registros en esta sección."
          />
        )}
      </CardContent>
    </Card>
  );
}
