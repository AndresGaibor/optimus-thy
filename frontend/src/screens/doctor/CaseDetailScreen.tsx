import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Callout,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Field,
  Select,
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
} from '../../design-system';
import type { CasoClinico } from '../fixtures/casos-extra';
import { ScreenFrame } from '../shared/ScreenFrame';

interface CaseDetailScreenProps {
  casos: CasoClinico[];
  state?: 'ready' | 'loading' | 'empty' | 'error';
}

export function CaseDetailScreen({ casos, state = 'ready' }: CaseDetailScreenProps) {
  const [casoId, setCasoId] = useState(casos[0]?.id ?? '');
  const caso = useMemo(() => casos.find((item) => item.id === casoId) ?? casos[0], [casoId, casos]);

  return (
    <ScreenFrame
      title="Caso clínico"
      description="Vista agrupada de ficha, documentos, imágenes e inferencias por caso."
    >
      {state === 'loading' ? (
        <Card aria-busy="true">
          <CardContent className="space-y-3 pt-6">
            <p className="text-sm text-muted-foreground">
              Cargando caso clínico. Espera un momento mientras se reúne la información.
            </p>
          </CardContent>
        </Card>
      ) : null}
      {state === 'error' ? (
        <Callout tone="danger" title="No se pudo cargar el caso">
          Revisa tu conexión e inténtalo de nuevo. Si el problema continúa, vuelve al listado de
          pacientes.
        </Callout>
      ) : null}
      {state === 'empty' || !caso ? (
        <EmptyState
          title="Sin casos disponibles"
          description="Este paciente no tiene casos registrados. Crea o selecciona otro paciente para continuar."
        />
      ) : null}
      {state === 'ready' && caso ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                {caso.codigo} · {caso.paciente}
                <Badge tone={caso.estado === 'Activo' ? 'success' : 'neutral'}>{caso.estado}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <p className="text-sm text-muted-foreground">Apertura: {caso.fechaApertura}</p>
                <p className="text-sm text-muted-foreground">Responsable: {caso.responsable}</p>
              </div>
              {casos.length > 1 ? (
                <Field label="Seleccionar caso">
                  <Select
                    aria-label="Seleccionar caso"
                    value={caso.id}
                    onChange={(event) => setCasoId(event.target.value)}
                  >
                    {casos.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.codigo} · {item.estado}
                      </option>
                    ))}
                  </Select>
                </Field>
              ) : null}
            </CardContent>
          </Card>
          <Tabs defaultValue="ficha">
            <TabsList aria-label="Contenido del caso">
              <TabsTrigger value="ficha">Ficha</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
              <TabsTrigger value="imagenes">Imágenes</TabsTrigger>
              <TabsTrigger value="inferencias">Inferencias</TabsTrigger>
            </TabsList>
            <TabsContent value="ficha">
              <Card>
                <CardContent className="space-y-3 pt-6">
                  <p>
                    <strong>Motivo:</strong> {caso.ficha.motivo}
                  </p>
                  <p>
                    <strong>Antecedentes:</strong> {caso.ficha.antecedentes}
                  </p>
                  <p>
                    <strong>Hallazgos:</strong> {caso.ficha.hallazgos}
                  </p>
                  <p>
                    <strong>Plan:</strong> {caso.ficha.plan}
                  </p>
                  <Button variant="outline">Ir a ficha clínica</Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="documentos">
              <div className="space-y-3">
                {caso.documentos.length ? (
                  <Table caption={`Documentos del caso ${caso.codigo}`}>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {caso.documentos.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>{doc.nombre}</TableCell>
                          <TableCell>{doc.tipo}</TableCell>
                          <TableCell>{doc.fecha}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyState
                    title="Sin documentos"
                    description="Este caso no tiene documentos asociados. Revisa la pantalla de Documentos si necesitas cargar uno."
                  />
                )}
                <Button variant="outline">Ir a documentos</Button>
              </div>
            </TabsContent>
            <TabsContent value="imagenes">
              <div className="space-y-3">
                {caso.imagenes.length ? (
                  <Table caption={`Imágenes del caso ${caso.codigo}`}>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Modalidad</TableHead>
                        <TableHead>Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {caso.imagenes.map((imagen) => (
                        <TableRow key={imagen.id}>
                          <TableCell>{imagen.nombre}</TableCell>
                          <TableCell>{imagen.modalidad}</TableCell>
                          <TableCell>{imagen.fecha}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyState
                    title="Sin imágenes"
                    description="Este caso no tiene imágenes asociadas. Revisa la pantalla de Imágenes médicas para agregar evidencia."
                  />
                )}
                <Button variant="outline">Ir a imágenes</Button>
              </div>
            </TabsContent>
            <TabsContent value="inferencias">
              <div className="space-y-3">
                {caso.inferencias.length ? (
                  <Table caption={`Inferencias del caso ${caso.codigo}`}>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Resultado</TableHead>
                        <TableHead>Confianza</TableHead>
                        <TableHead>Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {caso.inferencias.map((inf) => (
                        <TableRow key={inf.id}>
                          <TableCell>{inf.resultado}</TableCell>
                          <TableCell>{Math.round(inf.confianza * 100)}%</TableCell>
                          <TableCell>{inf.fecha}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyState
                    title="Sin inferencias"
                    description="Este caso no tiene inferencias registradas. Revisa la pantalla de Resultados cuando exista un análisis disponible."
                  />
                )}
                <Button variant="outline">Ir a inferencias</Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : null}
    </ScreenFrame>
  );
}
