import { Callout, Card, CardContent, CardHeader, CardTitle } from '../../design-system';
import { unuqConsentimiento, unuqParticipantes } from '../fixtures/unuq-extra';

export function UnuqProtocol() {
  const total = unuqParticipantes.reduce((t, p) => t + p.cantidad, 0);
  return (
    <div className="space-y-4">
      <Callout tone="warning" title="Material de estudio, no funcionalidad del producto">
        Representación académica del instrumento UnUQ. No registra respuestas reales ni altera
        OPTIMUS-THY.
      </Callout>
      <Card>
        <CardHeader>
          <CardTitle>Protocolo de evaluación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {total} evaluadores (médicos, investigadores y administradores) completan tareas por
            rol, otorgan consentimiento informado y responden 22 ítems en escala de 5 puntos.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            {unuqParticipantes.map((p) => (
              <article
                key={p.rol}
                className="rounded-card border border-border bg-surface-subtle p-4"
              >
                <h3 className="font-semibold">
                  {p.rol} · {p.cantidad} evaluadores
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {p.tareas.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <p className="text-sm">
            <strong>Consentimiento informado:</strong> {unuqConsentimiento}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
