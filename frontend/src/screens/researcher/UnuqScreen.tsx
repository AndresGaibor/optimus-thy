import { useState } from 'react';
import { Button } from '../../design-system';
import { unuqRespuestasAlta } from '../fixtures/unuq-extra';
import { DemoRoleLayout } from '../shared/DemoRoleLayout';
import { ScreenFrame } from '../shared/ScreenFrame';
import { UnuqProtocol } from './UnuqProtocol';
import { UnuqQuestionnaire } from './UnuqQuestionnaire';
import { UnuqResult } from './UnuqResult';

type View = 'protocolo' | 'cuestionario' | 'resultado';

export function UnuqScreen({
  initialView = 'protocolo',
  initialValues = unuqRespuestasAlta,
}: {
  initialView?: View;
  initialValues?: number[];
}) {
  const [view, setView] = useState<View>(initialView);
  const [values, setValues] = useState(initialValues);
  return (
    <DemoRoleLayout role="investigador">
      <ScreenFrame
        title="Evaluación UnUQ"
        description="Medición académica de usabilidad con 10 evaluadores, 22 ítems y 7 atributos. No es funcionalidad del producto."
      >
        <div className="flex flex-wrap gap-2">
          <Button
            variant={view === 'protocolo' ? 'default' : 'outline'}
            onClick={() => setView('protocolo')}
          >
            Protocolo
          </Button>
          <Button
            variant={view === 'cuestionario' ? 'default' : 'outline'}
            onClick={() => setView('cuestionario')}
          >
            Cuestionario
          </Button>
          <Button
            variant={view === 'resultado' ? 'default' : 'outline'}
            onClick={() => setView('resultado')}
          >
            Resultado
          </Button>
        </div>
        {view === 'protocolo' ? <UnuqProtocol /> : null}
        {view === 'cuestionario' ? (
          <UnuqQuestionnaire
            onSubmit={(a) => {
              setValues(a);
              setView('resultado');
            }}
          />
        ) : null}
        {view === 'resultado' ? <UnuqResult values={values} /> : null}
      </ScreenFrame>
    </DemoRoleLayout>
  );
}
