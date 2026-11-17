import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Spinner,
} from '../../design-system';
import type { ImagenCaso } from '../../api/imagenes';

interface GaleriaImagenesProps {
  imagenes: ImagenCaso[];
  analizando: string | null;
  puedeAnalizar: boolean;
  onAnalizar: (imagen: ImagenCaso) => void;
}

const FORMATO_FECHA = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' });

/** Ecografías del caso con la acción de analizarlas. */
export function GaleriaImagenes({
  imagenes,
  analizando,
  puedeAnalizar,
  onAnalizar,
}: GaleriaImagenesProps) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {imagenes.map((imagen) => (
        <li key={imagen.id}>
          <Card className="flex h-full flex-col">
            <CardHeader>
              <CardTitle>
                {imagen.formato.toUpperCase()} {imagen.ancho}×{imagen.alto}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <img
                src={imagen.url}
                alt={`Ecografía de ${imagen.ancho} por ${imagen.alto} píxeles`}
                className="w-full rounded-md border border-border"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {FORMATO_FECHA.format(new Date(imagen.creado_en))}
              </p>
            </CardContent>
            <CardFooter>
              {analizando === imagen.id ? (
                <Spinner size="sm" label="Analizando la ecografía" />
              ) : (
                <Button
                  size="sm"
                  onClick={() => onAnalizar(imagen)}
                  disabled={!puedeAnalizar || analizando !== null}
                >
                  Analizar
                </Button>
              )}
            </CardFooter>
            {puedeAnalizar ? null : (
              <p className="px-6 pb-4 text-xs text-muted-foreground">
                Falta un consentimiento vigente de atención de salud.
              </p>
            )}
          </Card>
        </li>
      ))}
    </ul>
  );
}
