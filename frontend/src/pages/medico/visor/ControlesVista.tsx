import { Button, Field, Input } from '../../../design-system';

const MIN_AJUSTE = 50;
const MAX_AJUSTE = 150;
const PASO_AJUSTE = 5;

export interface ControlesVistaProps {
  /** Brillo en porcentaje; 100 deja la vista como está. */
  brillo: number;
  /** Contraste en porcentaje; 100 deja la vista como está. */
  contraste: number;
  /** Cambia el brillo solo en la vista. */
  onBrilloChange: (brillo: number) => void;
  /** Cambia el contraste solo en la vista. */
  onContrasteChange: (contraste: number) => void;
  /** Restablece el zoom y el desplazamiento al tamaño de ventana. */
  onAjustarAVentana: () => void;
  /** Indica si la vista ya está ajustada a la ventana. */
  ajustadoAVentana: boolean;
}

/** Ajustes de brillo, contraste y encuadre del visor; nunca tocan el archivo. */
export function ControlesVista({
  brillo,
  contraste,
  onBrilloChange,
  onContrasteChange,
  onAjustarAVentana,
  ajustadoAVentana,
}: ControlesVistaProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
      <Field label={`Brillo: ${brillo} %`}>
        <Input
          type="range"
          min={MIN_AJUSTE}
          max={MAX_AJUSTE}
          step={PASO_AJUSTE}
          value={brillo}
          onChange={(event) => onBrilloChange(Number(event.target.value))}
        />
      </Field>
      <Field label={`Contraste: ${contraste} %`}>
        <Input
          type="range"
          min={MIN_AJUSTE}
          max={MAX_AJUSTE}
          step={PASO_AJUSTE}
          value={contraste}
          onChange={(event) => onContrasteChange(Number(event.target.value))}
        />
      </Field>
      <Button variant="outline" onClick={onAjustarAVentana} disabled={ajustadoAVentana}>
        Ajustar a ventana
      </Button>
    </div>
  );
}
