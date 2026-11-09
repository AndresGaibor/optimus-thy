import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Callout, Dialog, DialogClose, Input, Label } from '..';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '..';

function FilaMicrocopy({
  contexto,
  correcto,
  incorrecto,
}: {
  contexto: string;
  correcto: string;
  incorrecto: string;
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">{contexto}</TableCell>
      <TableCell>
        <Callout tone="success" title="Correcto">
          {correcto}
        </Callout>
      </TableCell>
      <TableCell>
        <Callout tone="danger" title="Incorrecto">
          {incorrecto}
        </Callout>
      </TableCell>
    </TableRow>
  );
}

function FilaGlosario({
  termino,
  significado,
  escritura,
}: {
  termino: string;
  significado: string;
  escritura: string;
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">{termino}</TableCell>
      <TableCell>{significado}</TableCell>
      <TableCell>{escritura}</TableCell>
    </TableRow>
  );
}

function ContenidoGuia() {
  return (
    <main className="min-h-screen bg-background p-6 text-foreground sm:p-8">
      <div className="mx-auto max-w-(--content-max-width) space-y-8">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">Contenido</p>
          <h1 className="text-3xl font-semibold tracking-tight">Tono, microcopy y glosario</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Ejemplos con componentes reales. El texto guía sin culpar, explica qué ocurrió y ofrece
            una acción clara. La IA no diagnostica.
          </p>
        </header>

        <section className="space-y-3 rounded-card border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">Tono y microcopy</h2>
          <p className="text-sm text-muted-foreground">
            Ejemplos correctos e incorrectos para situaciones frecuentes del flujo clínico.
          </p>
          <Table caption="Ejemplos de microcopy correctos e incorrectos">
            <TableHeader>
              <TableRow>
                <TableHead>Contexto</TableHead>
                <TableHead>Correcto</TableHead>
                <TableHead>Incorrecto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <FilaMicrocopy
                contexto="Error de campo"
                correcto="TI-RADS solo acepta valores TR1 a TR5. Revisa el valor ingresado."
                incorrecto="Ingresaste un TI-RADS inválido. Corrige tu error."
              />
              <FilaMicrocopy
                contexto="Vacío"
                correcto="No hay registros para mostrar. Ajusta los filtros o crea un nuevo registro."
                incorrecto="Nada aquí. No hiciste nada todavía."
              />
              <FilaMicrocopy
                contexto="Confirmación destructiva"
                correcto="Esta acción eliminará el registro seleccionado. Revisa los datos antes de continuar."
                incorrecto="¿Seguro? Vas a romper este registro para siempre."
              />
              <FilaMicrocopy
                contexto="Aviso de IA"
                correcto="La IA sugiere una clasificación orientativa. La decisión clínica corresponde al profesional responsable."
                incorrecto="La IA diagnosticó el caso. Confirma el diagnóstico automático."
              />
            </TableBody>
          </Table>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2 rounded-card border border-border bg-surface-subtle p-4">
              <Label htmlFor="tirads-ejemplo">Campo con error (ejemplo)</Label>
              <Input id="tirads-ejemplo" aria-invalid="true" defaultValue="TR9" />
              <p className="text-sm text-danger">TI-RADS solo acepta valores TR1 a TR5.</p>
            </div>
            <Dialog
              trigger={<Button variant="outline">Ver confirmación destructiva</Button>}
              title="Eliminar registro sintético"
              description="Esta acción eliminará el registro seleccionado. Revisa los datos antes de continuar."
              footer={
                <>
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button variant="destructive">Eliminar registro</Button>
                  </DialogClose>
                </>
              }
            >
              <p className="text-sm text-muted-foreground">
                Ejemplo de confirmación: el texto explica la consecuencia y ofrece cancelar.
              </p>
            </Dialog>
          </div>
        </section>

        <section className="space-y-3 rounded-card border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">Glosario clínico</h2>
          <p className="text-sm text-muted-foreground">
            Términos usados en el producto. Regla: «Normal = sin nódulo detectado».
          </p>
          <Table caption="Glosario clínico del producto">
            <TableHeader>
              <TableRow>
                <TableHead>Término</TableHead>
                <TableHead>Significado</TableHead>
                <TableHead>Cómo se escribe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <FilaGlosario
                termino="Normal"
                significado="Sin nódulo detectado en el estudio."
                escritura="Usar «Normal»; aclarar: Normal = sin nódulo detectado."
              />
              <FilaGlosario
                termino="Benigno"
                significado="Hallazgo con características no sugestivas de malignidad según criterio clínico."
                escritura="Mayúscula inicial en etiqueta; no presentar como diagnóstico automático."
              />
              <FilaGlosario
                termino="Maligno"
                significado="Hallazgo sugestivo de malignidad según criterio clínico y estudios complementarios."
                escritura="Mayúscula inicial en etiqueta; nunca como conclusión emitida por IA."
              />
              <FilaGlosario
                termino="TI-RADS"
                significado="Sistema de clasificación ecográfica de nódulos tiroideos (categorías TR1–TR5)."
                escritura="Mayúsculas con guion: TI-RADS; categoría como TR1–TR5."
              />
              <FilaGlosario
                termino="Bethesda"
                significado="Sistema para informar citología tiroidea por PAAF (categorías I–VI)."
                escritura="Bethesda con mayúscula inicial; categoría romana I–VI."
              />
              <FilaGlosario
                termino="PAAF"
                significado="Punción aspiración con aguja fina, procedimiento para obtener muestra citológica."
                escritura="Sigla en mayúsculas: PAAF; puede expandirse en el primer uso."
              />
              <FilaGlosario
                termino="CIE-10"
                significado="Clasificación Internacional de Enfermedades, 10.ª revisión, usada para codificación."
                escritura="Sigla y número con guion: CIE-10."
              />
              <FilaGlosario
                termino="Consentimiento"
                significado="Autorización informada de la persona para el uso o tratamiento de sus datos según el contexto."
                escritura="Consentimiento, en minúscula dentro de oración; indicar alcance y contexto."
              />
              <FilaGlosario
                termino="Normal = sin nódulo"
                significado="Regla de redacción: cuando no se detecta nódulo, el estado se comunica como Normal."
                escritura="Mantener la equivalencia explícita en guías y etiquetas clínicas relevantes."
              />
            </TableBody>
          </Table>
        </section>
      </div>
    </main>
  );
}

const meta = {
  title: 'Guías y calidad/Contenido y microcopy',
  component: ContenidoGuia,
  tags: ['ai-generated'],
} satisfies Meta<typeof ContenidoGuia>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Glosario: Story = {};
