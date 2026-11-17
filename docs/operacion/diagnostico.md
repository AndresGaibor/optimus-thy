# Diagnóstico seguro

Las comprobaciones de esta guía son de solo lectura. No borrar contenedores, volúmenes, objetos ni archivos para intentar recuperar el servicio; ante duda, detenerse y escalar.

| Síntoma | Comprobación de solo lectura | Acción segura |
|---|---|---|
| Contenedor detenido/no saludable | `docker compose ps`; `docker inspect <contenedor> --format '{{json .State}}'` | Revisar causa y logs antes de cualquier reinicio. Identificar explícitamente el proyecto Compose. |
| Salud HTTP falla | `curl -sS -o /dev/null -w '%{http_code}\n' https://<IP_TAILSCALE>:18443/health` (ajustar destino aprobado) | Comparar healthchecks internos y borde; no cambiar reglas de firewall/proxy sin autorización. |
| Errores en logs | `docker compose logs --since=30m <servicio>` | Registrar hora y servicio; redactar secretos y datos sensibles antes de compartir. |
| Migraciones Alembic | `docker compose exec backend alembic current`; `docker compose exec backend alembic heads` | Comparar revisión actual y única head esperada. No ejecutar `upgrade` durante diagnóstico; el deploy explícito gestiona migraciones. |
| MinIO/S3 no disponible | `docker compose ps storage`; `docker compose logs --since=30m storage`; comprobar health endpoint interno | Confirmar endpoint/bucket y salud sin mostrar credenciales; no recrear storage ni borrar objetos. |
| Red/proxy no enruta | `docker network inspect <red>`; `docker inspect <edge> --format '{{json .NetworkSettings.Networks}}'` | Confirmar identidad de red, DNS/upstream y publicación de puertos; no exponer puertos adicionales. |
| Disco lleno | `df -h`; `df -i`; `docker system df` | Identificar consumo y solicitar ventana de mantenimiento. No ejecutar prune ni borrar datos como diagnóstico. |
| Certificado HTTPS inválido/caducado | `openssl s_client -connect <IP_TAILSCALE>:18443 -servername <NOMBRE_TAILNET> </dev/null` | Revisar fecha, SAN, cadena y montaje del certificado; no desactivar validación TLS para ocultar el problema. |
| Respaldo ausente/fallido | Listar nombres/tamaños y comprobar manifiesto con `sha256sum -c SHA256SUMS-*`; no mostrar clave | Confirmar timer y resultado sin alterar archivos; si no hay copia íntegra y descifrable, detener release y escalar. |

Los marcadores `<IP_TAILSCALE>` y `<NOMBRE_TAILNET>` son ilustrativos; datos efectivos y conectividad del servidor están pendientes de verificar. Nunca incluir claves o datos clínicos en comandos compartidos.
