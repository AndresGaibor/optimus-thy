import { Activity, ArrowLeft } from 'lucide-react';
import { Button, RoleCard } from '../../design-system';
export interface RoleSelectionScreenProps {
  onSelect: (role: 'medico' | 'investigador' | 'administrador') => void;
  onBack: () => void;
}

const roles: Array<{
  role: 'medico' | 'investigador' | 'administrador';
  description: string;
  highlights: string[];
  actionLabel: string;
  hoverBorder: string;
}> = [
  {
    role: 'medico',
    description:
      'Gestión de pacientes, fichas clínicas, envío de estudios a IA y visualización de resultados.',
    highlights: ['Pacientes', 'Fichas Clínicas', 'Inferencia IA', 'Resultados', 'Imágenes Médicas'],
    actionLabel: 'Entrar como Médico',
    hoverBorder: 'hover:border-role-doctor/40',
  },
  {
    role: 'investigador',
    description:
      'Auditoría de modelos IA, comparación de predicciones, métricas de rendimiento y datos desidentificados.',
    highlights: ['Métricas IA', 'Auditoría', 'Datasets', 'Análisis de Errores', 'Cohortes'],
    actionLabel: 'Entrar como Investigador',
    hoverBorder: 'hover:border-role-researcher/40',
  },
  {
    role: 'administrador',
    description: 'Gestión de usuarios, roles, permisos, auditoría y configuración del sistema.',
    highlights: ['Usuarios', 'Roles', 'Privacidad', 'Auditoría', 'Configuración'],
    actionLabel: 'Entrar como Administrador',
    hoverBorder: 'hover:border-role-admin/40',
  },
];

export function RoleSelectionScreen({ onSelect, onBack }: RoleSelectionScreenProps) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-surface-subtle to-surface px-4 py-10 text-foreground">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 size-4" aria-hidden="true" />
          Volver al inicio
        </Button>

        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand">
              <Activity className="h-7 w-7 text-brand-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">OPTIMUS-THY</h1>
          <p className="text-muted-foreground">Seleccione su rol para acceder al sistema</p>
        </div>

        <section aria-labelledby="role-options-title">
          <h2 id="role-options-title" className="sr-only">
            Perfiles disponibles
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {roles.map((item) => (
              <RoleCard
                key={item.role}
                role={item.role}
                description={item.description}
                highlights={item.highlights}
                actionLabel={item.actionLabel}
                className={`transition-colors ${item.hoverBorder}`}
                onSelect={() => onSelect(item.role)}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
