import { useState, type FormEvent } from 'react';
import {
  type CrearSolicitud,
  type TipoDerecho,
  crearSolicitud,
} from '../../../api/solicitudes-derechos';
import { Button } from '../../../design-system/components/atoms/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../design-system/components/atoms/Card';
import { Input } from '../../../design-system/components/atoms/Input';
import { Select } from '../../../design-system/components/atoms/Select';
import { Callout } from '../../../design-system/components/molecules/Callout';
import { Field } from '../../../design-system/components/molecules/Field';

const TIPOS: { value: TipoDerecho; label: string }[] = [
  { value: 'acceso', label: 'Acceso' },
  { value: 'rectificacion', label: 'Rectificación' },
  { value: 'cancelacion', label: 'Cancelación' },
  { value: 'oposicion', label: 'Oposición' },
];

function fechaHoy(): string {
  const hoy = new Date();
  const desplazamiento = hoy.getTimezoneOffset() * 60_000;
  return new Date(hoy.getTime() - desplazamiento).toISOString().slice(0, 10);
}

interface FormularioSolicitudProps {
  onCreada: () => void;
}

export function FormularioSolicitud({ onCreada }: FormularioSolicitudProps) {
  const [tipo, setTipo] = useState<TipoDerecho>('acceso');
  const [referencia, setReferencia] = useState('');
  const [solicitadaEn, setSolicitadaEn] = useState(fechaHoy);
  const [plazo, setPlazo] = useState('15');
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<{ exito: boolean; texto: string } | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensaje(null);
    const referenciaLimpia = referencia.trim();
    const dias = Number(plazo);
    if (!/^[A-Za-z0-9._-]{3,64}$/.test(referenciaLimpia)) {
      setErrorValidacion('Usa entre 3 y 64 letras, números, puntos, guiones o guiones bajos.');
      return;
    }
    if (!solicitadaEn) {
      setErrorValidacion('Indica la fecha de solicitud.');
      return;
    }
    if (!Number.isInteger(dias) || dias < 1 || dias > 60) {
      setErrorValidacion('El plazo debe ser un número entero entre 1 y 60 días.');
      return;
    }

    setErrorValidacion(null);
    setEnviando(true);
    const cuerpo: CrearSolicitud = {
      tipo,
      referencia_titular: referenciaLimpia,
      solicitada_en: solicitadaEn,
      plazo_dias: dias,
    };
    const resultado = await crearSolicitud(cuerpo);
    setEnviando(false);
    if (!resultado.ok) {
      setMensaje({ exito: false, texto: resultado.error });
      return;
    }
    setMensaje({ exito: true, texto: 'La solicitud se registró correctamente.' });
    setReferencia('');
    onCreada();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar solicitud</CardTitle>
        <CardDescription>
          Usa una referencia interna del titular. No incluyas nombres ni datos clínicos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={enviar}>
          <Field label="Tipo de derecho" required>
            <Select value={tipo} onChange={(evento) => setTipo(evento.target.value as TipoDerecho)}>
              {TIPOS.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Referencia del titular"
            required
            hint="3-64 caracteres: letras, números, punto, guion o guion bajo."
            error={errorValidacion?.startsWith('Usa') ? errorValidacion : undefined}
          >
            <Input
              autoComplete="off"
              maxLength={64}
              value={referencia}
              onChange={(evento) => setReferencia(evento.target.value)}
            />
          </Field>
          <Field label="Fecha de solicitud" required>
            <Input
              type="date"
              value={solicitadaEn}
              onChange={(evento) => setSolicitadaEn(evento.target.value)}
            />
          </Field>
          <Field label="Plazo (días)" required hint="Entre 1 y 60 días; predeterminado: 15.">
            <Input
              type="number"
              min={1}
              max={60}
              step={1}
              value={plazo}
              onChange={(evento) => setPlazo(evento.target.value)}
            />
          </Field>
          {errorValidacion && !errorValidacion.startsWith('Usa') ? (
            <p role="alert" className="text-sm font-medium text-danger sm:col-span-2">
              {errorValidacion}
            </p>
          ) : null}
          {mensaje ? (
            <Callout
              className="sm:col-span-2"
              tone={mensaje.exito ? 'success' : 'danger'}
              role={mensaje.exito ? 'status' : 'alert'}
            >
              {mensaje.texto}
            </Callout>
          ) : null}
          <div className="sm:col-span-2">
            <Button type="submit" loading={enviando}>
              Registrar solicitud
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
