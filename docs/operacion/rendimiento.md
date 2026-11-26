# Medición de rendimiento

## Repetir

Desde la raíz del repositorio, con Docker, Docker Compose, `curl`, Python 3 y `lscpu`/`free` instalados:

```bash
bash tests/rendimiento/medir.sh
```

El script crea un nombre de proyecto Compose `rend-<aleatorio>`, asigna puertos libres y una red propia, y usa solo el archivo temporal de variables sintéticas (no carga `.env`). Inicia PostgreSQL, almacenamiento, backend, frontend, edge e IA sin pesos; aplica migraciones, siembra cinco pacientes/casos de `backend/scripts/seed_sintetico.py` y prepara una cuenta de medición sintética. Espera 200 en `/health` durante un máximo de 300 s. Un fallo de arranque termina con código 3 y el motivo. Al terminar se detiene el proyecto propio y se retiran solo sus volúmenes identificados por la etiqueta de proyecto; nunca se usa `docker compose down -v`.

Mide 50 solicitudes de cada operación (`GET /health`, `POST /auth/login`, `GET /pacientes`, `GET /casos/{id}` y `POST /trabajos`), calcula p50/p95/p99 y captura `docker stats --no-stream`. La salida se imprime en Markdown y se guarda en `docs/operacion/rendimiento-<fecha>.md`; una nueva ejecución del mismo día reemplaza el informe de ese día. El proceso no carga pesos de IA: `POST /trabajos` informa solo sobre validación y encolado, no sobre la inferencia real. Para permitir las 50 muestras consecutivas, el stack efímero eleva `RATE_LIMIT_POR_MINUTO` a 500 y `INFERENCIA_POR_MINUTO` a 100; el informe lo indica, por lo que las latencias no representan los límites operativos predeterminados.

## Interpretar el resultado

Cada informe identifica el host, CPU, arquitectura, RAM, versión de Docker y commit medido. La ejecución de referencia de este procedimiento se hizo en el host remoto Linux del entorno de trabajo, **no en la laptop de demostración**. Por tanto, el número no sustituye la medición en la laptop: la prefigura. Para describir otro equipo como laptop de demostración, ejecútese allí y actualícese esa identificación solo con esa evidencia.

Los percentiles describen la latencia observada en las 50 muestras de cada ruta; p95/p99 reflejan colas y variación que un promedio ocultaría. Compárese una ruta consigo misma entre ejecuciones con el mismo commit y datos, y consérvese el contexto del host. La memoria de `docker stats` corresponde a los contenedores en el instante de captura, no a la RAM total consumida durante todo el arranque.

No se deben comparar directamente cifras entre una VM/servidor y una laptop. En la laptop la CPU suele compartirse con interfaz gráfica y otras aplicaciones; el almacenamiento puede tener distinta latencia y el rendimiento de red puede cambiar por Wi-Fi, VPN o acceso a servicios locales. Estos factores alteran el arranque, las consultas y la cola incluso cuando el código es idéntico. El informe no mide el tiempo de inferencia real ni sustituye una prueba de carga concurrente.
