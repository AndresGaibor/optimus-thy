import { Mail } from 'lucide-react';
import { useState } from 'react';
import {
  Button,
  Callout,
  Dialog,
  PageHeader,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../design-system';
import { CorreoPlantillaForm, verificarVariables } from './CorreoPlantillaForm';
import { CorreoServidorForm } from './CorreoServidorForm';
import { useCorreo } from './useCorreo';

/**
 * Configura el servidor de correo y la plantilla que usan los envíos.
 *
 * ## Cuándo usarlo
 * Es la pantalla de administración del correo saliente; requiere `ajustes.gestionar`.
 * ## Cuándo no usarlo
 * No muestra ni edita la contraseña guardada, y no gestiona usuarios ni plantillas nuevas.
 * ## Anatomía
 * Encabezado, dos pestañas (Servidor y Plantilla), formularios con avisos y vista previa aislada.
 * ## Accesibilidad
 * Cada campo lleva etiqueta visible; los avisos se anuncian con `role="status"` y el diálogo de restauración conserva el foco y cierra con Escape.
 * ## Responsive
 * Una columna en móvil; dos columnas desde `sm` (640 px) para los campos del servidor.
 */
export function CorreoPage() {
  const correo = useCorreo();
  const [confirmarRestaurar, setConfirmarRestaurar] = useState(false);

  if (correo.cargando) {
    return <Spinner size="lg" label="Cargando configuración del correo" />;
  }

  if (correo.errorCarga || !correo.configuracion) {
    return (
      <section className="mx-auto w-full max-w-(--content-max-width) space-y-4 px-4 py-6">
        <PageHeader title="Correo" description="Servidor SMTP y plantillas de los envíos." />
        <Callout tone="danger" title="No se pudo cargar">
          {correo.errorCarga ?? 'La configuración no está disponible.'}
        </Callout>
        <Button variant="outline" onClick={() => void correo.cargar()}>
          Reintentar
        </Button>
      </section>
    );
  }

  const guardarPlantilla = () => {
    if (correo.modo !== 'html') {
      void correo.guardarLaPlantilla();
      return;
    }
    const problema = verificarVariables(correo.asunto) ?? verificarVariables(correo.html);
    if (problema) {
      correo.setMensajePlantilla({ tipo: 'error', texto: problema });
      return;
    }
    void correo.guardarLaPlantilla();
  };

  return (
    <section className="mx-auto w-full max-w-(--content-max-width) space-y-6 px-4 py-6">
      <PageHeader
        title="Correo"
        description="Servidor SMTP y plantillas de los envíos, incluida la recuperación de contraseña."
      />

      <Tabs defaultValue="plantilla">
        <TabsList>
          <TabsTrigger value="servidor">Servidor</TabsTrigger>
          <TabsTrigger value="plantilla">Plantilla</TabsTrigger>
        </TabsList>

        <TabsContent value="servidor" className="grid gap-4">
          <CorreoServidorForm
            configuracion={correo.configuracion}
            preset={correo.preset}
            password={correo.password}
            guardando={correo.guardando}
            probando={correo.probando}
            mensaje={correo.mensaje}
            onChange={correo.cambiar}
            onPreset={correo.elegirPreset}
            onPassword={correo.setPassword}
            onGuardar={() => void correo.guardarServidor()}
            onProbar={() => void correo.enviarPrueba()}
          />
        </TabsContent>

        <TabsContent value="plantilla" className="grid gap-4">
          <CorreoPlantillaForm
            asunto={correo.asunto}
            modo={correo.modo}
            campos={correo.campos}
            html={correo.html}
            vista={correo.vista}
            vistaCargando={correo.vistaCargando}
            mensaje={correo.mensajePlantilla}
            guardando={correo.guardandoPlantilla}
            deFabrica={correo.plantillaGuardada?.de_fabrica === true}
            onAsunto={correo.setAsunto}
            onModo={correo.setModo}
            onCampo={correo.editarCampo}
            onHtml={correo.setHtml}
            onGuardar={guardarPlantilla}
            onRestaurar={() => setConfirmarRestaurar(true)}
          />
        </TabsContent>
      </Tabs>

      <Dialog
        open={confirmarRestaurar}
        onOpenChange={setConfirmarRestaurar}
        title="Restaurar la plantilla"
        description="Se borrará la plantilla guardada y volverá la de fábrica."
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmarRestaurar(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setConfirmarRestaurar(false);
                void correo.restaurar();
              }}
            >
              <Mail aria-hidden="true" className="size-4" />
              Restaurar
            </Button>
          </>
        }
      />
    </section>
  );
}
