import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../design-system/components/atoms/Badge';
import { Button } from '../../design-system/components/atoms/Button';
import { Spinner } from '../../design-system/components/atoms/Spinner';
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
import { Pagination } from '../../design-system/components/molecules/Pagination';
import { listarPacientes, type Paciente } from '../../api/pacientes';
import { FiltrosResultados } from './FiltrosResultados';
import {
  descargarReporte,
  listarResultadosGuardados,
  type ResultadoGuardado,
} from '../../api/resultados';

const LIMITE_POR_PAGINA = 20;
const FORMATO_FECHA = new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium', timeStyle: 'short' });
const ETIQUETAS: Record<string, { texto: string; tono: 'success' | 'danger' | 'neutral' }> = {
  benigno: { texto: 'Benigno', tono: 'success' },
  maligno: { texto: 'Maligno', tono: 'danger' },
  sin_nodulo: { texto: 'Normal (sin nódulo)', tono: 'neutral' },
};

export function ResultadosPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [paciente, setPaciente] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [clase, setClase] = useState('');
  const [desplazamiento, setDesplazamiento] = useState(0);
  const [resultados, setResultados] = useState<ResultadoGuardado[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [descargando, setDescargando] = useState<string | null>(null);
  const [errorDescarga, setErrorDescarga] = useState(false);

  useEffect(() => {
    void listarPacientes({ limite: 50 }).then((resultado) => {
      if (resultado.ok) setPacientes(resultado.data.items);
    });
  }, []);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await listarResultadosGuardados({
        ...(paciente ? { paciente } : {}),
        ...(desde ? { desde } : {}),
        ...(hasta ? { hasta } : {}),
        ...(clase ? { clase } : {}),
        limite: LIMITE_POR_PAGINA,
        desplazamiento,
      });
      setResultados(datos.items);
      setTotal(datos.total);
    } catch {
      setError('No se pudieron cargar los resultados. Reintenta la operación.');
      setResultados([]);
      setTotal(0);
    } finally {
      setCargando(false);
    }
  }, [paciente, desde, hasta, clase, desplazamiento]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  function cambiarFiltro(actualizar: () => void) {
    actualizar();
    setDesplazamiento(0);
  }

  async function descargar(resultado: ResultadoGuardado) {
    setErrorDescarga(false);
    setDescargando(resultado.id);
    try {
      const { contenido, nombre } = await descargarReporte(resultado.caso_id, resultado.id);
      const url = URL.createObjectURL(contenido);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = nombre;
      enlace.click();
      URL.revokeObjectURL(url);
    } catch {
      setErrorDescarga(true);
    } finally {
      setDescargando(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Resultados"
        description="Inferencias guardadas de la institución, filtrables por paciente, fecha y clase."
      />

      <FiltrosResultados
        pacientes={pacientes}
        paciente={paciente}
        desde={desde}
        hasta={hasta}
        clase={clase}
        onPaciente={(valor) => cambiarFiltro(() => setPaciente(valor))}
        onDesde={(valor) => cambiarFiltro(() => setDesde(valor))}
        onHasta={(valor) => cambiarFiltro(() => setHasta(valor))}
        onClase={(valor) => cambiarFiltro(() => setClase(valor))}
      />

      {error ? (
        <Callout tone="danger" title="No se pudieron cargar los resultados">
          {error}
        </Callout>
      ) : null}
      {errorDescarga ? (
        <Callout tone="danger" title="No se pudo descargar el reporte">
          Inténtalo de nuevo; la descarga queda registrada cuando se completa.
        </Callout>
      ) : null}

      {cargando ? (
        <Spinner size="lg" label="Cargando resultados" />
      ) : resultados.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description="Ajusta los filtros o analiza una ecografía para generar resultados."
        />
      ) : (
        <Table caption="Resultados guardados">
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Caso</TableHead>
              <TableHead>Resultado</TableHead>
              <TableHead>Confianza</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resultados.map((fila) => {
              const etiqueta = ETIQUETAS[fila.resultado] ?? {
                texto: 'Sin clasificar',
                tono: 'neutral' as const,
              };
              return (
                <TableRow key={fila.id}>
                  <TableCell>{FORMATO_FECHA.format(new Date(fila.creado_en))}</TableCell>
                  <TableCell>{fila.paciente_codigo}</TableCell>
                  <TableCell>
                    <Link className="underline" to={`/medico/casos/${fila.caso_id}`}>
                      {fila.caso_codigo}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge tone={etiqueta.tono}>{etiqueta.texto}</Badge>
                  </TableCell>
                  <TableCell>
                    {fila.confianza === null ? '—' : `${(fila.confianza * 100).toFixed(1)} %`}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      loading={descargando === fila.id}
                      onClick={() => void descargar(fila)}
                    >
                      Reporte PDF
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <Pagination
        total={total}
        limit={LIMITE_POR_PAGINA}
        offset={desplazamiento}
        onOffsetChange={setDesplazamiento}
        itemLabel="resultado"
      />
    </div>
  );
}
