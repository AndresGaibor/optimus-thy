# Medición de rendimiento — 2026-11-26

Esta medición no se ejecutó en la laptop de demostración; el número no sustituye la medición en la laptop, la prefigura.

| Dato | Valor |
|---|---|
| Máquina | oci (Linux) |
| Laptop de demostración | No confirmada; asumir no |
| CPU | Neoverse-N1 |
| Arquitectura | aarch64 |
| RAM del host | 23Gi total, 13Gi usada, 367Mi disponible |
| Docker | 29.10.0 |
| Commit medido | `19c22dd7ecea746df7455edd8262046f03e1a63c` |
| Arranque frío hasta `/health` | 35884.5 ms |
| Proyecto aislado | `rend-1795697255-2846120551` |
| URL medida | `http://127.0.0.1:56579` |
| Límite global sintético | 500 por minuto |
| Límite de inferencias sintético | 100 por minuto |

## Latencias

| Operación | Muestras | p50 | p95 | p99 |
|---|---:|---:|---:|---:|
| health | 50 | 2.66 ms | 7.31 ms | 7.87 ms |
| login | 50 | 122.07 ms | 250.34 ms | 309.62 ms |
| pacientes | 50 | 28.61 ms | 42.20 ms | 53.07 ms |
| caso | 50 | 26.75 ms | 41.31 ms | 46.42 ms |
| trabajo | 50 | 16.45 ms | 32.32 ms | 42.40 ms |

## Memoria de contenedores

| Contenedor | Uso de memoria | Porcentaje |
|---|---:|---:|
| rend-1795697255-2846120551-backend-1 | 93.3MiB/23.41GiB | 0.39% |
| rend-1795697255-2846120551-edge-1 | 0B/0B | 0.00% |
| rend-1795697255-2846120551-frontend-1 | 4.754MiB/23.41GiB | 0.02% |
| rend-1795697255-2846120551-ia-1 | 48.24MiB/23.41GiB | 0.20% |
| rend-1795697255-2846120551-postgres-1 | 29.73MiB/23.41GiB | 0.12% |
| rend-1795697255-2846120551-storage-1 | 206.5MiB/23.41GiB | 0.86% |

Para obtener 50 muestras consecutivas, el límite global se elevó a 500/min y el de inferencias a 100/min en el contenedor de medición. Las latencias no representan los límites operativos predeterminados. `POST /trabajos` mide únicamente validación y encolado; no se cargaron pesos ni se midió inferencia real. El stack medido incluye PostgreSQL, almacenamiento, backend, frontend, edge e IA sin pesos.
