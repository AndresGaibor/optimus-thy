import { useId } from 'react';
import type { ImagenCaso } from '../../../api/imagenes';
import { formatearBytes, formatearDimensiones, formatearFecha, formatearVigencia } from './formato';

interface MetadatosImagenProps {
  /** Ecografía mostrada en el visor. */
  imagen: ImagenCaso;
}

/** Datos de la ecografía que acompañan al visor (HU-061). */
export function MetadatosImagen({ imagen }: MetadatosImagenProps) {
  const tituloId = useId();
  const datos = [
    { etiqueta: 'Formato', valor: imagen.formato.toUpperCase() },
    { etiqueta: 'Dimensiones', valor: formatearDimensiones(imagen.ancho, imagen.alto) },
    { etiqueta: 'Tamaño', valor: formatearBytes(imagen.tamano_bytes) },
    { etiqueta: 'Fecha', valor: formatearFecha(imagen.creado_en) },
    { etiqueta: 'Huella', valor: `${imagen.sha256.slice(0, 12)}…` },
    { etiqueta: 'Enlace', valor: `válido ${formatearVigencia(imagen.url_expira_en)}` },
  ];

  return (
    <section aria-labelledby={tituloId} className="flex flex-col gap-2">
      <h3 id={tituloId} className="text-sm font-semibold">
        Metadatos de la ecografía
      </h3>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {datos.map((dato) => (
          <div key={dato.etiqueta} className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">{dato.etiqueta}</dt>
            <dd className="text-sm font-medium">{dato.valor}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
