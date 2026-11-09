import type { ReactNode } from 'react';
import { PageHeader } from '../../design-system/components/molecules/PageHeader';

export interface ScreenFrameProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

/** Marco común de las pantallas del catálogo; no añade rutas ni comportamiento de servidor. */
export function ScreenFrame({ title, description, actions, children }: ScreenFrameProps) {
  return (
    <section className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-(--content-max-width) space-y-6">
        <PageHeader
          title={title}
          {...(description !== undefined ? { description } : {})}
          {...(actions !== undefined ? { actions } : {})}
        />
        <div className="space-y-6">{children}</div>
      </div>
    </section>
  );
}
