import {
  Button,
  Callout,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  Field,
  Input,
} from '../../design-system';
import { useSegundoFactor } from './useSegundoFactor';

/**
 * ## Cuándo usarlo
 * Para gestionar el segundo factor de autenticación de la cuenta propia.
 * ## Cuándo no usarlo
 * No lo uses para administrar los factores de otras cuentas.
 * ## Anatomía
 * Muestra el estado actual y las acciones de activación o desactivación.
 * ## Accesibilidad
 * Los formularios tienen etiquetas visibles, errores anunciados y diálogos con nombre.
 * ## Responsive
 * Los controles se apilan en una columna y ocupan el ancho disponible.
 */
export function SeguridadSegundoFactor() {
  const {
    activo,
    enrolamiento,
    codigo,
    setCodigo,
    password,
    setPassword,
    codigos,
    error,
    exito,
    ocupado,
    cerrarDialogo,
    iniciar,
    confirmar,
    desactivar,
  } = useSegundoFactor();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Segundo factor de autenticación</CardTitle>
        <CardDescription>
          Protege el acceso con un código temporal de tu aplicación de autenticación.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <p aria-live="polite" className="text-sm font-medium text-foreground">
          Estado: {activo === null ? 'Consultando…' : activo ? 'Activado' : 'Desactivado'}
        </p>
        {error ? (
          <Callout tone="danger" role="alert">
            {error}
          </Callout>
        ) : null}
        {exito ? (
          <Callout tone="success" role="status">
            {exito}
          </Callout>
        ) : null}
        {activo === false ? (
          <Button type="button" onClick={iniciar} loading={ocupado}>
            Activar segundo factor
          </Button>
        ) : null}
        {activo ? (
          <form className="grid gap-4" onSubmit={desactivar} noValidate>
            <Field label="Contraseña actual" required>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </Field>
            <Button type="submit" variant="destructive" loading={ocupado} disabled={!password}>
              Desactivar segundo factor
            </Button>
          </form>
        ) : null}
      </CardContent>
      <Dialog
        open={Boolean(enrolamiento || codigos)}
        onOpenChange={cerrarDialogo}
        title={
          codigos
            ? 'Guarda tus códigos de recuperación'
            : 'Configura tu aplicación de autenticación'
        }
        description={
          codigos
            ? 'Cada código se puede usar una sola vez. Guárdalos en un lugar seguro.'
            : 'Añade esta cuenta a tu aplicación y confirma con un código de seis dígitos.'
        }
      >
        {codigos ? (
          <ul className="grid gap-2 font-mono text-sm" aria-label="Códigos de recuperación">
            {codigos.map((codigoRecuperacion) => (
              <li key={codigoRecuperacion}>{codigoRecuperacion}</li>
            ))}
          </ul>
        ) : enrolamiento ? (
          <div className="grid gap-4">
            <p className="text-sm text-foreground">Secreto para introducir manualmente:</p>
            <code className="select-all break-all rounded-control border border-border bg-muted p-3 text-sm text-foreground">
              {enrolamiento.secreto}
            </code>
            <a
              className="break-all text-sm font-medium text-primary underline-offset-4 hover:underline"
              href={enrolamiento.uri}
            >
              Abrir enlace otpauth
            </a>
            <form className="grid gap-4" onSubmit={confirmar} noValidate>
              <Field label="Código de seis dígitos" required>
                <Input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  value={codigo}
                  onChange={(event) => setCodigo(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  autoFocus
                />
              </Field>
              <Button type="submit" loading={ocupado} disabled={codigo.length !== 6}>
                Confirmar y activar
              </Button>
            </form>
          </div>
        ) : null}
      </Dialog>
    </Card>
  );
}
