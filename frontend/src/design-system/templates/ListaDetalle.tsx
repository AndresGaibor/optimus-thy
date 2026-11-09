import { useMemo, useState } from 'react';
import { Button } from '../components/atoms/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/atoms/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/atoms/Tabs';
import { EmptyState } from '../components/molecules/EmptyState';
import { SearchInput } from '../components/molecules/SearchInput';

export interface ListaDetalleItem {
  id: string;
  titulo: string;
  detalle: string;
}

export interface ListaDetalleProps {
  items: ListaDetalleItem[];
}

export function ListaDetalle({ items }: ListaDetalleProps) {
  const [consulta, setConsulta] = useState('');
  const [seleccionId, setSeleccionId] = useState('');

  const filtrados = useMemo(() => {
    const texto = consulta.trim().toLocaleLowerCase('es');
    if (!texto) return items;
    return items.filter((item) =>
      `${item.titulo} ${item.detalle}`.toLocaleLowerCase('es').includes(texto),
    );
  }, [items, consulta]);

  const seleccionado = items.find((item) => item.id === seleccionId);

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader className="gap-3">
          <CardTitle as="h2">Elementos</CardTitle>
          <SearchInput
            label="Buscar elementos"
            value={consulta}
            onChange={(event) => setConsulta(event.target.value)}
            onClear={() => setConsulta('')}
            placeholder="Título o detalle"
          />
        </CardHeader>
        <CardContent className="space-y-2">
          {filtrados.length ? (
            <ul aria-label="Elementos disponibles" className="space-y-2">
              {filtrados.map((item) => (
                <li key={item.id}>
                  <Button
                    variant="outline"
                    onClick={() => setSeleccionId(item.id)}
                    aria-current={seleccionado?.id === item.id ? 'true' : undefined}
                    className="h-auto w-full justify-start whitespace-normal p-3 text-left aria-[current=true]:border-brand aria-[current=true]:bg-surface-subtle"
                  >
                    <span className="min-w-0">
                      <span className="block font-medium text-foreground">{item.titulo}</span>
                      <span className="mt-1 block text-sm font-normal text-muted-foreground">
                        {item.detalle}
                      </span>
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Sin resultados"
              description="Ajusta la búsqueda o crea un elemento nuevo."
            />
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        {seleccionado ? (
          <CardContent className="space-y-4 p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-foreground">{seleccionado.titulo}</h2>
            <Tabs defaultValue="resumen">
              <TabsList aria-label={`Secciones de ${seleccionado.titulo}`}>
                <TabsTrigger value="resumen">Resumen</TabsTrigger>
                <TabsTrigger value="historial">Historial</TabsTrigger>
              </TabsList>
              <TabsContent value="resumen">
                <p className="text-sm text-foreground">{seleccionado.detalle}</p>
              </TabsContent>
              <TabsContent value="historial">
                <EmptyState
                  title="Sin historial todavía"
                  description={`Los eventos de «${seleccionado.titulo}» aparecerán aquí.`}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        ) : (
          <CardContent className="p-5 sm:p-6">
            <EmptyState
              title="Selecciona un elemento"
              description="Elige un registro de la lista para consultar su detalle."
            />
          </CardContent>
        )}
      </Card>
    </div>
  );
}
