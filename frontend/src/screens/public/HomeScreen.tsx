import { ArrowRight, Activity } from 'lucide-react';
import { BrandMark, Button, Card, CardContent, RoleCard } from '../../design-system';
export interface HomeScreenProps {
  onChooseRole: (role: 'medico' | 'investigador' | 'administrador') => void;
  onExploreRoles: () => void;
}
export function HomeScreen({ onChooseRole, onExploreRoles }: HomeScreenProps) {
  const explore = () => {
    onExploreRoles();
    document.getElementById('roles')?.scrollIntoView({ behavior: 'smooth' });
  };
  const roles = [
    {
      role: 'medico' as const,
      description: 'Consulta fichas, estudios e información de apoyo.',
      actionLabel: 'Entrar como Médico',
    },
    {
      role: 'investigador' as const,
      description: 'Explora métricas y conjuntos de datos sintéticos.',
      actionLabel: 'Entrar como Investigador',
    },
    {
      role: 'administrador' as const,
      description: 'Revisa usuarios, configuración y actividad.',
      actionLabel: 'Entrar como Administrador',
    },
  ];
  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <div className="mx-auto max-w-6xl space-y-12">
        <header className="flex items-center justify-between">
          <BrandMark />
          <span className="text-sm text-muted-foreground">Espacio de demostración</span>
        </header>
        <section className="grid gap-10 py-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-sm font-medium text-brand">
              Información clínica, con revisión profesional
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-6xl">
              Una mirada más clara a cada estudio.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              OPTIMUS-THY reúne registros e imágenes sintéticas y presenta herramientas de apoyo
              para la revisión médica.
            </p>
            <Button onClick={explore}>
              Explorar espacios <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
          <Card className="border-brand/20 bg-brand/5">
            <CardContent className="p-8">
              <div className="mb-7 flex size-16 items-center justify-center rounded-2xl bg-brand text-brand-foreground">
                <Activity className="size-8" />
              </div>
              <p className="text-sm font-medium text-brand">Revisión con contexto</p>
              <h2 className="mt-2 text-2xl font-semibold">
                La decisión sigue en manos del profesional.
              </h2>
              <p className="mt-3 text-muted-foreground">
                OCR e IA ayudan a organizar la información; no establecen diagnósticos.
              </p>
            </CardContent>
          </Card>
        </section>
        <section id="roles" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Elige tu espacio de trabajo</h2>
            <p className="mt-2 text-muted-foreground">
              Tres perspectivas, con la misma importancia.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {roles.map((item) => (
              <RoleCard
                key={item.role}
                role={item.role}
                description={item.description}
                actionLabel={item.actionLabel}
                onSelect={() => onChooseRole(item.role)}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
