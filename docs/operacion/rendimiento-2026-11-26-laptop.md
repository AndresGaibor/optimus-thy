# Medición de rendimiento — 2026-11-26 — laptop de demostración

Medición ejecutada en la laptop de demostración (MacBook Air M1), con el stack completo por Docker Compose en ese equipo. Sustituye como referencia para RNF-REN-01 y RNF-REN-02 al informe del host Linux, que sigue en `rendimiento-2026-11-26.md`.

| Dato | Valor |
|---|---|
| Máquina | MacBook Air M1 (Darwin, arm64) |
| Laptop de demostración | Sí |
| CPU | Apple M1 |
| Arquitectura | arm64 |
| RAM del host | 8 GiB total |
| Docker | 29.4.0 (OrbStack) |
| Commit medido | `8e505f58bdf5ea369a64d9b4100dd3aec38ebd5d` |
| Arranque en frío hasta `/health` | 89 835 ms |
| Proyecto aislado | `rend-1795705132-45902352` |
| URL medida | `http://127.0.0.1:62388` |
| Límite global sintético | 500 por minuto |
| Límite de inferencias sintético | 100 por minuto |

## Latencias

| Operación | Muestras | p50 | p95 | p99 |
|---|---:|---:|---:|---:|
| health | 50 | 5,12 ms | 8,45 ms | 10,66 ms |
| login | 50 | 52,50 ms | 94,86 ms | 238,16 ms |
| pacientes | 50 | 20,39 ms | 27,60 ms | 30,91 ms |
| caso | 50 | 21,29 ms | 26,35 ms | 27,86 ms |
| trabajo | 50 | 20,07 ms | 25,06 ms | 28,67 ms |

## Memoria de contenedores

| Contenedor | Uso de memoria | Porcentaje |
|---|---:|---:|
| backend | 93,1 MiB | 2,34 % |
| edge | 0 B | 0,00 % |
| frontend | 15,49 MiB | 0,39 % |
| ia | 46,59 MiB | 1,17 % |
| postgres | 27,48 MiB | 0,69 % |
| storage | 265,1 MiB | 6,65 % |

## Comparación con las metas

| Requisito | Meta | Medido | Veredicto |
|---|---|---|---|
| RNF-REN-01 — pantallas de consulta en el entorno local | p95 < 2000 ms | pacientes 27,60 ms; caso 26,35 ms | Cumple con margen amplio |
| RNF-REN-02 — una inferencia entrega resultado en un tiempo máximo | 60 s como meta inicial | No medido: el stack de medición no carga pesos | Pendiente de la primera medición con el modelo cargado |

El arranque en frío de 89 835 ms corresponde al primer despliegue de las imágenes en OrbStack (descarga y construcción), no a un reinicio con imágenes presentes. Para permitir 50 muestras consecutivas, el límite global se elevó a 500/min y el de inferencias a 100/min: las latencias no representan los límites operativos predeterminados. `POST /trabajos` mide validación y encolado, no inferencia.

## Reproducir

En la laptop, desde la raíz del repositorio con Docker en marcha:

```bash
LAPTOP_DEMO=1 bash tests/rendimiento/medir.sh
```

Sin `LAPTOP_DEMO=1` el informe generado se marca como medición de otro host y no sustituye a esta.
