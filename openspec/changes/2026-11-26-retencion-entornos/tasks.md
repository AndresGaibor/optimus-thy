# Tasks

## 1. Configuración y guardas de entorno

- [ ] 1.1 Añadir los plazos operativos y validar sus límites; verificar `tests/test_config.py`.
- [ ] 1.2 Bloquear configuraciones inseguras en producción y advertir cruces de entorno sin revelar secretos; verificar `tests/test_config_entornos.py`.

## 2. Purga operativa

- [ ] 2.1 Implementar conteo y borrado en lotes de trabajos terminales y alertas revisadas, omitiendo tabla ausente; verificar `tests/test_retencion.py`.
- [ ] 2.2 Añadir CLI de simulación y doble activación con salida sin datos personales; verificar simulación, purga deshabilitada y conteos en `tests/test_retencion.py`.

## 3. Operación

- [ ] 3.1 Añadir el servicio y temporizador systemd diarios a las 04:30; verificar las unidades con `systemd-analyze verify`.
- [ ] 3.2 Documentar activación, simulación, verificación y conservación de auditoría en `docs/operacion/retencion.md`.

## 4. Especificación y aceptación

- [ ] 4.1 Completar propuesta, diseño y delta de especificación en `openspec/changes/2026-11-26-retencion-entornos/`.
- [ ] 4.2 Ejecutar la aceptación focalizada de configuración, retención y pruebas de configuración existentes.
