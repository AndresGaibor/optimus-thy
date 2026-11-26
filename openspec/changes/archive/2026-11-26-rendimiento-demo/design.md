# Diseño

## Contexto

El `docker-compose.yml` define frontend, backend, PostgreSQL, almacenamiento y servicios de OCR/IA; el backend depende de PostgreSQL y almacenamiento, mientras que inferencia se encola como trabajo. Existe `backend/scripts/seed_sintetico.py` para crear pacientes y casos sintéticos con consentimiento clínico. La medición debe describir ese stack sin tocar el despliegue habitual.

## Decisiones

- Ejecutar Compose con `-p rend-<identificador>` y un overlay temporal que asigna una red propia al proyecto. Elegir puertos efímeros para el borde HTTP/HTTPS; borrar solo el archivo temporal y bajar servicios del proyecto en un `trap`.
- Usar el seed existente dentro del contenedor backend y crear una cuenta sintética con los roles y permisos ya sembrados por migraciones; obtener caso desde el seed y utilizarlo para la API y el trabajo de inferencia.
- Medir con `curl` 50 muestras secuenciales por endpoint; resumir percentiles en milisegundos. En el stack efímero elevar `RATE_LIMIT_POR_MINUTO` a 500 e `INFERENCIA_POR_MINUTO` a 100 para evitar que los cupos predeterminados impidan completar las muestras; documentar esta diferencia. Incluir trabajo encolado, no duración de inferencia, dado que no se instalan/cargan pesos.
- Esperar la ruta backend `/health` publicada en un puerto local temporal, con timeout finito y salida 3 si no responde. Guardar un informe Markdown fechado y mostrar también la tabla en stdout.
- Registrar CPU/arquitectura, RAM, Docker, commit y `docker stats --no-stream`; el host actual se declara no perteneciente a la laptop de demostración salvo evidencia expresa en contrario.

## Alternativas descartadas

- Sembrar por API: requeriría crear un usuario privilegiado y más operaciones de preparación; el seed disponible crea casos coherentes y consentimiento sin depender de API.
- Usar puertos fijos o el proyecto Compose por defecto: puede colisionar con el despliegue que ya existe y no garantiza aislamiento de red.
- Reportar una sola media o ignorar el hardware: oculta colas y variabilidad y no permite comparar hosts.

## Riesgos y límites

La reserva y liberación de puertos tiene una ventana de carrera normal de sockets efímeros. Los componentes comparten el host y sus cargas pueden variar. El resultado de un servidor/VM no predice la laptop: CPU compartida, disco y red son distintos. La ruta de inferencia mide validación y encolado; sin pesos no caracteriza cálculo del modelo.
