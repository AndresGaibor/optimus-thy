import { Maximize2 } from 'lucide-react';
import { useState } from 'react';
import type { ImagenCaso } from '../../../api/imagenes';
import { Button } from '../../../design-system';
import { DialogoVisor } from './DialogoVisor';

export interface AbrirVisorProps {
  /** Ecografías del caso, en el orden de navegación. */
  imagenes: ImagenCaso[];
  /** Texto del disparador; por defecto, `Abrir visor`. */
  etiqueta?: string;
}

/** Punto de montaje del visor de ecografías (HU-061). */
export function AbrirVisor({ imagenes, etiqueta = 'Abrir visor' }: AbrirVisorProps) {
  const [abierto, setAbierto] = useState(false);
  const [indice, setIndice] = useState(0);

  if (imagenes.length === 0) return null;

  return (
    <>
      <Button
        variant="outline"
        onClick={() => {
          setIndice(0);
          setAbierto(true);
        }}
      >
        <Maximize2 aria-hidden="true" />
        {etiqueta}
      </Button>
      <DialogoVisor
        imagenes={imagenes}
        indice={indice}
        abierto={abierto}
        onOpenChange={setAbierto}
        onIndiceChange={setIndice}
      />
    </>
  );
}
