import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  EmptyState,
  FilterBar,
  ScanViewport,
  SearchInput,
  Select,
  TiradsBadge,
} from '../../design-system';
import type { DemoImage } from '../fixtures/types';

export function ImagesGallery(props: {
  images: DemoImage[];
  selectorInferencia: boolean;
  confirmedInferenceId: string;
  onConfirmInference: (id: string) => void;
  onRequestDownload: (id: string) => void;
}) {
  const [query, setQuery] = useState(''),
    [kind, setKind] = useState('Todos'),
    [selected, setSelected] = useState<DemoImage | null>(null),
    [inferenceImageId, setInferenceImageId] = useState('');
  const shown = useMemo(
    () =>
      props.images.filter(
        (x) =>
          (kind === 'Todos' || x.tipo === kind) &&
          `${x.id} ${x.pacienteNombre} ${x.tipo} ${x.subtipo}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [props.images, kind, query],
  );
  return (
    <>
      <Card>
        <CardContent className="p-4">
          <FilterBar label="Filtros">
            <SearchInput
              label="Buscar imágenes"
              placeholder="Buscar paciente o estudio"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Select
              aria-label="Filtrar tipo de imagen"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              <option>Todos</option>
              {Array.from(new Set(props.images.map((x) => x.tipo))).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </Select>
          </FilterBar>
        </CardContent>
      </Card>
      {props.selectorInferencia && shown.length > 0 && (
        <Card>
          <CardContent className="space-y-3 p-4">
            <h2 className="text-sm font-semibold">Imagen usada en la inferencia</h2>
            <div role="radiogroup" aria-label="Elegir imagen para inferencia" className="space-y-2">
              {shown.map((x, i) => {
                const checked = inferenceImageId === x.id;
                return (
                  <Button
                    key={x.id}
                    type="button"
                    variant={checked ? 'secondary' : 'outline'}
                    role="radio"
                    aria-checked={checked}
                    aria-label={`${x.id} ${x.subtipo}`}
                    className="h-auto w-full justify-start px-3 py-3 text-left"
                    onClick={() => setInferenceImageId(x.id)}
                  >
                    <span className="text-sm">
                      <span className="font-medium">{x.id}</span> · {x.subtipo}
                      <span className="block text-xs text-muted-foreground">
                        Estado: {i === 0 ? 'Apta para inferencia' : 'Registrada'} · visible en
                        historial
                      </span>
                    </span>
                  </Button>
                );
              })}
            </div>
            <Button
              size="sm"
              disabled={!inferenceImageId}
              onClick={() => props.onConfirmInference(inferenceImageId)}
            >
              Confirmar imagen para inferencia
            </Button>
          </CardContent>
        </Card>
      )}
      {shown.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((x, i) => (
            <Card key={x.id} className="overflow-hidden">
              <CardContent className="space-y-3 p-4">
                <Button
                  variant="ghost"
                  onClick={() => setSelected(x)}
                  aria-label={`Abrir ${x.id}`}
                  className="block h-auto w-full rounded-md p-0 hover:bg-transparent focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {x.src ? (
                    <img
                      src={x.src}
                      alt={`${x.tipo} ${x.subtipo} de ${x.pacienteNombre}`}
                      className="aspect-[4/3] w-full rounded-card border border-border object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <ScanViewport label={`${x.id} · representación sintética`} />
                  )}
                </Button>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {x.tipo} · {x.subtipo}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {x.pacienteNombre} · {x.fecha}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Estado:{' '}
                      {props.confirmedInferenceId === x.id
                        ? 'Elegida para inferencia'
                        : i === 0
                          ? 'Registrada'
                          : 'Disponible'}{' '}
                      · Fecha: {x.fecha} · Participantes: 1
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <TiradsBadge value={x.tiRads} />
                    {props.selectorInferencia && props.confirmedInferenceId === x.id ? (
                      <Badge tone="success">Activa</Badge>
                    ) : null}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{x.hallazgo}</p>
                <p className="text-xs text-muted-foreground">
                  {x.formato} · {x.resolucion} · {x.tamano}
                </p>
                <Button variant="outline" size="sm" onClick={() => props.onRequestDownload(x.id)}>
                  Solicitar acceso a archivo
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            props.images.length === 0 ? 'No hay estudios registrados' : 'No se encontraron imágenes'
          }
          description="Prueba otro filtro."
        />
      )}
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
        title={selected ? `${selected.id} · ${selected.tipo}` : 'Visor de imagen'}
        description="Ilustración vectorial sintética; no es una imagen clínica."
      >
        <div className="space-y-3">
          {selected?.src ? (
            <img
              src={selected.src}
              alt={`${selected.tipo} ${selected.subtipo} de ${selected.pacienteNombre}`}
              className="aspect-[4/3] w-full rounded-card border border-border object-contain"
            />
          ) : (
            <ScanViewport label={selected?.subtipo ?? 'Representación vectorial'} />
          )}
          <p>{selected?.hallazgo}</p>
          <p className="text-sm text-muted-foreground">
            Requiere interpretación profesional; no es un diagnóstico.
          </p>
          <Button
            variant="outline"
            onClick={() => selected && props.onRequestDownload(selected.id)}
          >
            Solicitar acceso a archivo
          </Button>
        </div>
      </Dialog>
    </>
  );
}
