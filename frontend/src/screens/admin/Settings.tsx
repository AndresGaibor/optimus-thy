import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  Select,
  Input,
  Switch,
} from '../../design-system';
import { DemoRoleLayout } from '../shared/DemoRoleLayout';
import { ScreenFrame } from '../shared/ScreenFrame';
import { ResearcherLayout } from '../researcher/ResearcherBlocks';
import { adminFixtures } from '../fixtures/admin';

const notificationLabels = {
  completedInference: 'Inferencia completada',
  failedAccess: 'Acceso fallido',
  newUser: 'Alta de usuario',
  securityAlert: 'Alerta de seguridad',
} satisfies Record<keyof typeof adminFixtures.settings.notifications, string>;

type SettingsData = {
  systemName: string;
  institution: string;
  language: string;
  mfa: string;
  sessionTimeout: string;
  encryption: boolean;
  storageProvider: string;
  uploadLimitMb: number;
  notifications: Record<string, boolean>;
};

export function Settings({
  settings,
  onSave,
}: {
  settings: SettingsData;
  onSave: (settings: SettingsData) => void;
}) {
  const [draft, setDraft] = useState(settings);
  return (
    <DemoRoleLayout role="administrador">
      <ScreenFrame
        title="Configuración del sistema"
        description="Controles presentacionales con valores sintéticos."
      >
        <ResearcherLayout
          title="Preferencias de demostración"
          description="Los controles no persisten cambios ni afectan servicios reales."
        >

          <form
            className="grid gap-4 lg:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              onSave(draft);
            }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Seguridad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Autenticación multifactor">
                  <Select
                    value={draft.mfa}
                    onChange={(e) => setDraft({ ...draft, mfa: e.target.value })}
                  >
                    <option value="desactivado">Desactivado</option>
                    <option value="obligatorio">Obligatorio</option>
                    <option value="opcional">Opcional</option>
                  </Select>
                </Field>
                <Field label="Duración de sesión">
                  <Select
                    value={draft.sessionTimeout}
                    onChange={(e) => setDraft({ ...draft, sessionTimeout: e.target.value })}
                  >
                    <option value="15">15 minutos</option>
                    <option value="30">30 minutos</option>
                    <option value="60">60 minutos</option>
                  </Select>
                </Field>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm">Cifrado de demostración</span>
                  <Switch
                    aria-label="Cifrado de demostración"
                    checked={draft.encryption}
                    onCheckedChange={(encryption: boolean) => setDraft({ ...draft, encryption })}
                  />
                </div>
                <Button type="submit">Guardar preferencias</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Privacidad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(draft.notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <span className="text-sm">
                      {notificationLabels[key as keyof typeof notificationLabels]}
                    </span>
                    <Switch
                      aria-label={notificationLabels[key as keyof typeof notificationLabels]}
                      checked={value}
                      onCheckedChange={(checked: boolean) =>
                        setDraft({
                          ...draft,
                          notifications: { ...draft.notifications, [key]: checked },
                        })
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Catálogo de modelos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Proveedor">
                  <Select
                    value={draft.storageProvider}
                    onChange={(e) => setDraft({ ...draft, storageProvider: e.target.value })}
                  >
                    <option value="local">Local</option>
                    <option value="nube">Nube</option>
                  </Select>
                </Field>
                <Field label="Modelo activo">
                  <Select
                    value={draft.systemName}
                    onChange={(e) => setDraft({ ...draft, systemName: e.target.value })}
                  >
                    <option value="ThyroidNet">ThyroidNet</option>
                    <option value="ThyroDetect">ThyroDetect</option>
                  </Select>
                </Field>
                <Field label="Límite (MB)">
                  <Input
                    type="number"
                    value={draft.uploadLimitMb}
                    onChange={(e) => setDraft({ ...draft, uploadLimitMb: Number(e.target.value) })}
                  />
                </Field>
              </CardContent>
            </Card>
          </form>
        </ResearcherLayout>
      </ScreenFrame>
    </DemoRoleLayout>
  );
}
