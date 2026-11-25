import { Button, DialogClose } from '../../../design-system';
import type { Paso } from './compartidos';

interface PieConclusionProps {
  paso: Paso;
  enviando: boolean;
  errorEnvio: boolean;
  onVolver: () => void;
  onRevisar: () => void;
  onEnviar: () => void;
}

/** Acciones al pie del diálogo según el paso; en lectura solo permite cerrar. */
export function PieConclusion({
  paso,
  enviando,
  errorEnvio,
  onVolver,
  onRevisar,
  onEnviar,
}: PieConclusionProps) {
  if (paso === 'consulta') {
    return (
      <DialogClose asChild>
        <Button variant="outline">Cancelar</Button>
      </DialogClose>
    );
  }
  if (paso === 'lectura') {
    return (
      <DialogClose asChild>
        <Button>Cerrar</Button>
      </DialogClose>
    );
  }
  if (paso === 'formulario') {
    return (
      <>
        <DialogClose asChild>
          <Button variant="outline">Cancelar</Button>
        </DialogClose>
        <Button onClick={onRevisar}>Revisar conclusión</Button>
      </>
    );
  }
  return (
    <>
      <Button variant="outline" disabled={enviando} onClick={onVolver}>
        Volver
      </Button>
      <Button loading={enviando} onClick={onEnviar}>
        {errorEnvio ? 'Reintentar envío' : 'Enviar conclusión'}
      </Button>
    </>
  );
}
