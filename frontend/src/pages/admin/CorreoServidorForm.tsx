import { Save, Send } from 'lucide-react';
import { Button, Callout, Field, Input, Select, Switch } from '../../design-system';
import type { ConfiguracionCorreo } from '../../api/correo';

export interface MensajeCorreo {
  tipo: 'ok' | 'error';
  texto: string;
}

export interface CorreoServidorFormProps {
  configuracion: ConfiguracionCorreo;
  preset: 'gmail' | 'otro';
  password: string;
  guardando: boolean;
  probando: boolean;
  mensaje: MensajeCorreo | null;
  onChange: (parcial: Partial<ConfiguracionCorreo>) => void;
  onPreset: (preset: 'gmail' | 'otro') => void;
  onPassword: (password: string) => void;
  onGuardar: () => void;
  onProbar: () => void;
}

/** Formulario del servidor SMTP con el preset de Gmail y el envío de prueba. */
export function CorreoServidorForm({
  configuracion,
  preset,
  password,
  guardando,
  probando,
  mensaje,
  onChange,
  onPreset,
  onPassword,
  onGuardar,
  onProbar,
}: CorreoServidorFormProps) {
  return (
    <div className="grid gap-4">
      <Field label="Proveedor" hint="Gmail rellena el servidor y el cifrado por ti.">
        <Select
          value={preset}
          onChange={(evento) => onPreset(evento.target.value as 'gmail' | 'otro')}
        >
          <option value="gmail">Gmail</option>
          <option value="otro">Otro servidor</option>
        </Select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Servidor">
          <Input
            value={configuracion.host}
            autoComplete="off"
            onChange={(evento) => onChange({ host: evento.target.value })}
          />
        </Field>
        <Field label="Puerto">
          <Input
            type="number"
            min={1}
            max={65535}
            value={configuracion.puerto}
            onChange={(evento) => onChange({ puerto: Number(evento.target.value) })}
          />
        </Field>
        <Field label="Cifrado">
          <Select
            value={configuracion.seguridad}
            onChange={(evento) =>
              onChange({ seguridad: evento.target.value as 'starttls' | 'ssl' })
            }
          >
            <option value="starttls">STARTTLS (587)</option>
            <option value="ssl">SSL (465)</option>
          </Select>
        </Field>
        <Field label="Usuario">
          <Input
            value={configuracion.usuario}
            autoComplete="username"
            onChange={(evento) => onChange({ usuario: evento.target.value })}
          />
        </Field>
        <Field label="Remitente">
          <Input
            type="email"
            value={configuracion.remitente}
            onChange={(evento) => onChange({ remitente: evento.target.value })}
          />
        </Field>
        <Field label="Nombre del remitente">
          <Input
            value={configuracion.remitente_nombre ?? ''}
            onChange={(evento) => onChange({ remitente_nombre: evento.target.value })}
          />
        </Field>
      </div>

      <Field
        label="Contraseña"
        hint={
          configuracion.tiene_password
            ? 'Ya hay una contraseña guardada; déjalo vacío para conservarla.'
            : 'En Gmail usa una contraseña de aplicación de 16 caracteres.'
        }
      >
        <Input
          type="password"
          autoComplete="new-password"
          value={password}
          placeholder={configuracion.tiene_password ? 'Sin cambios' : ''}
          onChange={(evento) => onPassword(evento.target.value)}
        />
      </Field>

      <div className="flex items-center gap-3">
        <Switch
          aria-label="Correo activo"
          checked={configuracion.activo}
          onCheckedChange={(activo) => onChange({ activo })}
        />
        <span className="text-sm text-foreground">Enviar correo con esta configuración</span>
      </div>

      {mensaje ? (
        <Callout tone={mensaje.tipo === 'ok' ? 'success' : 'danger'} role="status">
          {mensaje.texto}
        </Callout>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button onClick={onGuardar} disabled={guardando}>
          <Save aria-hidden="true" className="size-4" />
          Guardar
        </Button>
        <Button variant="outline" onClick={onProbar} disabled={probando}>
          <Send aria-hidden="true" className="size-4" />
          {probando ? 'Enviando…' : 'Enviar prueba'}
        </Button>
      </div>
    </div>
  );
}
