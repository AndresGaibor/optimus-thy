import { Link } from 'react-router-dom';
import { Button, Callout } from '../../../design-system';

interface PanelConsentimientoProps {
  /** Caso al que se le puede registrar el consentimiento. */
  casoId: string;
  /** Indica si el caso ya tiene consentimiento vigente para inferir. */
  tieneConsentimiento: boolean;
}

/** Aviso que explica cómo registrar el consentimiento que falta para inferir. */
export function PanelConsentimiento({ casoId, tieneConsentimiento }: PanelConsentimientoProps) {
  if (tieneConsentimiento) return null;

  return (
    <Callout tone="warning" title="Falta el consentimiento para inferir">
      <div className="flex flex-col gap-3">
        <span>
          La inferencia necesita un consentimiento vigente de atención de salud. Puedes cargar
          ecografías, pero no analizarlas hasta registrarlo.
        </span>
        <div>
          <Button asChild variant="outline" size="sm">
            <Link to={`/medico/casos/${casoId}`}>
              Abrir el caso para registrar el consentimiento
            </Link>
          </Button>
        </div>
      </div>
    </Callout>
  );
}
