import { Button } from '../../design-system/components/atoms/Button';

export interface RolesGuardadoProps {
  cambios: number;
  guardando: boolean;
  onDescartar: () => void;
  onGuardar: () => void;
}

/** Barra adhesiva con los cambios pendientes de la matriz. */
export function RolesGuardado({ cambios, guardando, onDescartar, onGuardar }: RolesGuardadoProps) {
  return (
    <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-control border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
      <p role="status" className="text-sm text-foreground">
        {cambios} {cambios === 1 ? 'cambio sin guardar' : 'cambios sin guardar'}. Los permisos
        actuales siguen vigentes hasta que guardes.
      </p>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={onDescartar} disabled={guardando}>
          Descartar
        </Button>
        <Button size="sm" onClick={onGuardar} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  );
}
