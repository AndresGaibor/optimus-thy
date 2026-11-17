import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import type { OrdenUsuarios } from '../../api/usuarios';
import { Button } from '../../design-system/components/atoms/Button';
import { TableHead } from '../../design-system/components/atoms/Table';

export type CampoOrdenable = Exclude<OrdenUsuarios, 'creado'>;

/** Cabecera de columna que alterna el orden del listado y anuncia `aria-sort`. */
export function EncabezadoOrdenable({
  campo,
  etiqueta,
  orden,
  direccion,
  onOrden,
  className,
}: {
  campo: CampoOrdenable;
  etiqueta: string;
  orden: OrdenUsuarios;
  direccion: 'asc' | 'desc';
  onOrden: (campo: CampoOrdenable) => void;
  className?: string;
}) {
  const activo = orden === campo;
  return (
    <TableHead
      aria-sort={activo ? (direccion === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={className}
    >
      <Button
        variant="ghost"
        size="sm"
        className={activo ? '-ml-2 gap-1 text-foreground' : '-ml-2 gap-1'}
        onClick={() => onOrden(campo)}
        aria-label={`Ordenar por ${etiqueta.toLowerCase()}`}
      >
        {etiqueta}
        {activo ? (
          direccion === 'asc' ? (
            <ArrowUp aria-hidden className="size-3.5" />
          ) : (
            <ArrowDown aria-hidden className="size-3.5" />
          )
        ) : (
          <ChevronsUpDown aria-hidden className="size-3.5 text-muted-foreground" />
        )}
      </Button>
    </TableHead>
  );
}
