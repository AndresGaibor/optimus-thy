# Tareas

- [x] `GET /auditoria/exportar` con los filtros del listado y tope de 5000 filas.
- [x] CSV UTF-8 con columnas del listado sin `direccion_ip` y nombre fechado.
- [x] Evento `EXPORT.EXPORT` con `resource_count`, sin contenido.
- [x] Pruebas de backend: CSV válido, filtros, tope, permiso y evento.
- [x] Función `exportarBitacora` en el cliente y botón en la pantalla.
- [x] Pruebas de frontend: filtros en la petición y error de descarga.
- [ ] Regenerar `contracts/openapi.json` y `frontend/src/api/schema.d.ts` al integrar.
