import {
  Badge,
  Callout,
  Card,
  CardContent,
  EmptyState,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../design-system';
import type { CasoClinico } from '../fixtures/casos-extra';
import { ScreenFrame } from '../shared/ScreenFrame';

export interface CaseManagementScreenProps {
  casos: CasoClinico[];
  state?: 'ready' | 'loading' | 'empty' | 'error';
}

export function CaseManagementScreen({ casos, state = 'ready' }: CaseManagementScreenProps) {
  return (
    <ScreenFrame
      title="Gestión de casos"
      description="Consulta el estado y la información asociada a los casos clínicos."
    >
      {state === 'loading' ? (
        <Card aria-busy="true">
          <CardContent className="flex items-center gap-3 p-5">
            <Spinner label="Cargando casos clínicos" />
            <span>Cargando casos clínicos.</span>
          </CardContent>
        </Card>
      ) : null}
      {state === 'error' ? (
        <Callout tone="danger" role="alert" title="No se pudieron cargar los casos">
          Revisa tu conexión e inténtalo de nuevo.
        </Callout>
      ) : null}
      {state === 'empty' || (state === 'ready' && casos.length === 0) ? (
        <EmptyState
          title="No hay casos para mostrar"
          description="Cuando haya casos clínicos disponibles, aparecerán en este listado."
          as="h2"
        />
      ) : null}
      {state === 'ready' && casos.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table caption="Casos clínicos">
              <TableHeader>
                <TableRow>
                  <TableHead>Caso</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Revisión</TableHead>
                  <TableHead>Información asociada</TableHead>
                  <TableHead>Apertura</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {casos.map((caso) => {
                  const pendienteRevision = caso.estado === 'Activo';
                  const informacionIncompleta = caso.imagenes.length === 0;

                  return (
                    <TableRow key={caso.id}>
                      <TableCell>
                        <div className="font-medium">{caso.codigo}</div>
                        <div className="text-sm text-muted-foreground">{caso.paciente}</div>
                      </TableCell>
                      <TableCell>
                        <Badge tone={caso.estado === 'Activo' ? 'success' : 'neutral'}>
                          {caso.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {pendienteRevision
                          ? 'Pendiente de revisión profesional'
                          : 'Revisión no pendiente'}
                      </TableCell>
                      <TableCell>
                        {informacionIncompleta ? (
                          <span>Información incompleta: no hay imágenes asociadas</span>
                        ) : (
                          <span>
                            {caso.documentos.length} documentos, {caso.imagenes.length} imágenes y{' '}
                            {caso.inferencias.length} inferencias
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{caso.fechaApertura}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </ScreenFrame>
  );
}
