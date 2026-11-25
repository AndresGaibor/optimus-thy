import { Link } from 'react-router-dom';
import { Badge } from '../../../design-system/components/atoms/Badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../design-system/components/atoms/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../design-system/components/atoms/Table';
import { RESULTADOS, SIN_CLASIFICAR } from '../conclusion/compartidos';
import { VEREDICTOS, fechaComparacion, porcentaje, type GrupoImagen } from './agrupacion';

interface GrupoComparacionProps {
  grupo: GrupoImagen;
}

/** Tarjeta de una imagen con una fila por modelo y la marca de coincidencia. */
export function GrupoComparacion({ grupo }: GrupoComparacionProps) {
  const etiqueta = VEREDICTOS[grupo.veredicto];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <CardTitle as="h2">Imagen {grupo.imagenId}</CardTitle>
            <CardDescription>
              Paciente {grupo.pacienteCodigo} · Caso{' '}
              <Link className="underline" to={`/medico/casos/${grupo.casoId}`}>
                {grupo.casoCodigo}
              </Link>{' '}
              · {fechaComparacion(grupo.creadoEn)}
            </CardDescription>
          </div>
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <Badge tone={etiqueta.tono}>{etiqueta.texto}</Badge>
            <p className="text-xs text-muted-foreground">{etiqueta.detalle}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Table caption={`Comparación de la imagen ${grupo.imagenId}`}>
          <TableHeader>
            <TableRow>
              <TableHead>Modelo</TableHead>
              <TableHead>Resultado</TableHead>
              <TableHead>Confianza</TableHead>
              <TableHead>Prob. benigno</TableHead>
              <TableHead>Prob. maligno</TableHead>
              <TableHead>Nódulos</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grupo.filas.map((fila) => {
              const resultado = RESULTADOS[fila.resultado] ?? SIN_CLASIFICAR;
              return (
                <TableRow key={fila.id}>
                  <TableCell>
                    <span className="font-medium text-foreground">{fila.modelo.nombre}</span>{' '}
                    <span className="text-muted-foreground">v{fila.modelo.version}</span>
                  </TableCell>
                  <TableCell>
                    <Badge tone={resultado.tono}>{resultado.texto}</Badge>
                  </TableCell>
                  <TableCell>{porcentaje(fila.confianza)}</TableCell>
                  <TableCell>{porcentaje(fila.probabilidadBenigno)}</TableCell>
                  <TableCell>{porcentaje(fila.probabilidadMaligno)}</TableCell>
                  <TableCell>{fila.nodulos}</TableCell>
                  <TableCell>{fechaComparacion(fila.creadoEn)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <p className="text-xs text-muted-foreground">
          La probabilidad de benignidad y malignidad es el valor máximo entre los nódulos detectados
          por cada modelo; sin nódulos no se reporta probabilidad.
        </p>
      </CardContent>
    </Card>
  );
}
