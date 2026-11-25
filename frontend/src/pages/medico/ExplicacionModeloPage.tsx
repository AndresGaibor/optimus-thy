import { Callout } from '../../design-system/components/molecules/Callout';
import { PageHeader } from '../../design-system/components/molecules/PageHeader';
import { BloqueModeloEnUso } from './modelo/BloqueModeloEnUso';
import { DecisionYAuditoria } from './modelo/DecisionYAuditoria';
import { LimitesDelModelo } from './modelo/LimitesDelModelo';
import { PasosDelModelo } from './modelo/PasosDelModelo';
import { SignificadoDeResultados } from './modelo/SignificadoDeResultados';

/**
 * Explicación del modelo y de sus límites (HU-074, RS-DER-06 y RS-IA-02).
 *
 * El texto no depende de la API: solo el bloque del modelo consulta la última
 * inferencia para mostrar versión y huella de pesos reales.
 */
export function ExplicacionModeloPage() {
  return (
    <section className="mx-auto w-full max-w-(--content-max-width) space-y-6 px-4 py-6">
      <PageHeader
        eyebrow="Apoyo a la decisión"
        title="Cómo funciona el modelo y cuáles son sus límites"
        description="Qué hace la cadena de IA con tu ecografía, cómo leer el resultado y qué decisiones siguen siendo tuyas."
      />

      <Callout
        tone="warning"
        role="alert"
        title="La predicción apoya tu criterio; no es un diagnóstico"
      >
        El sistema señala hallazgos y probabilidades a partir de una ecografía tiroidea. La
        interpretación, la conducta con el paciente y el registro de la conclusión son siempre del
        médico tratante.
      </Callout>

      <BloqueModeloEnUso />
      <PasosDelModelo />
      <SignificadoDeResultados />
      <LimitesDelModelo />
      <DecisionYAuditoria />
    </section>
  );
}
