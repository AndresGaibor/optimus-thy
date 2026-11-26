# Evidencias citables para los resultados

Cada fila remite a un artefacto versionado y a la cifra exacta que ese artefacto publica. Las capturas del catálogo son demostraciones con datos sintéticos: no representan pacientes, medidas del modelo ni una sesión autenticada del sistema real.

## Índice de tablas citables

| Tabla | Qué demuestra | Cifra exacta publicada | Artefacto | Comando para regenerarla |
| --- | --- | --- | --- | --- |
| Matriz de pruebas | Estado de cada requisito con caso, resultado y evidencia | 161 requisitos: 59 aprobados, 21 en curso y 81 pendientes | `docs/pruebas/matriz-de-pruebas.md` | No hay generador; se actualiza al ejecutar pruebas y reconciliar la evidencia. |
| Matriz de verificación operativa | Qué está verificado en local y qué exige el servidor real | 11 objetivos: 7 verificados localmente, 3 pendientes de verificar en servidor y 1 bloqueado por configuración externa | `docs/operacion/matriz-verificacion.md` | No hay generador; se actualiza con cada verificación de despliegue. |
| Registro de errores | Incidencias observadas y su corrección | 20 registros: 16 resueltos, 3 abiertos y 1 en corrección | `docs/pruebas/registro-de-errores.md` | No hay generador; se registra antes de corregir y se cierra con la prueba en verde. |
| Recorridos E2E | Que los flujos médico e investigador se recorren de punta a punta en un build de producción | 2 flujos (atención médica e investigación) en el job `E2E flujos (Playwright)`, que forma parte de `CI OK` | `docs/pruebas/e2e-flujos.md`; `frontend/e2e/flujos.ts` | `cd frontend && bun run e2e:flujos` |
| Rendimiento en la laptop de demostración | Latencias medidas en el equipo de la demostración | Arranque en frío hasta `/health`: 89 835 ms; p50/p95/p99 de health 5,12 / 8,45 / 10,66 ms, login 52,50 / 94,86 / 238,16 ms y pacientes 20,39 / 27,60 / 30,91 ms, con 50 muestras cada una | `docs/operacion/rendimiento-2026-11-26-laptop.md` | No hay comando versionado; la medición se ejecuta en la laptop con el stack completo y se registra en ese informe. |
| Seguridad y escaneo ZAP | Fugas de acceso entre instituciones y superficie HTTP anónima | 4 fugas corregidas; ZAP: 0 fallos, 9 avisos y 59 comprobaciones en verde sobre 9 URLs | `docs/cumplimiento/informe-seguridad.md`; `docs/cumplimiento/zap/zap.json` | `bash tests/seguridad/escanear.sh` (stack aislado; código de salida 2 con avisos) |
| Cobertura por suite | Qué ejecuta el gate y qué no publica | Sin cifra versionada: `make check` corre las suites pero no emite informe ni umbral de cobertura | `Makefile`; `frontend/package.json` | No hay comando versionado que produzca cobertura; los conteos de pruebas solo aparecen en el registro de cada ejecución de CI. |

## Índice de figuras

Las 12 capturas de línea base viven en `frontend/e2e/linea-base/`, son de **1440 × 900 px** y muestran el catálogo de Storybook con datos sintéticos. El manifiesto que las produce es `frontend/e2e/capturas.json`.

| Figura | Ruta | Qué muestra |
| --- | --- | --- |
| Médico: inferencia | `frontend/e2e/linea-base/aplicacion-medico-inferencia-de-ia--default--1440x900.png` | Pantalla de inferencia con aviso de apoyo a la decisión, cola y estados de demostración. |
| Médico: pacientes | `frontend/e2e/linea-base/aplicacion-medico-pacientes-hu-031--con-pacientes--1440x900.png` | Listado de pacientes con registros sintéticos. |
| Médico: revisión de OCR | `frontend/e2e/linea-base/aplicacion-medico-flujo-ocr--baja-calidad--1440x900.png` | Estado de revisión de un documento con baja calidad. |
| Administrador: permiso denegado | `frontend/e2e/linea-base/aplicacion-administrador-acceso-denegado--permiso-faltante--1440x900.png` | Mensaje de acceso denegado con el permiso que falta. |
| Diseño: plantilla de métricas | `frontend/e2e/linea-base/sistema-de-diseno-plantillas-panel-de-metricas--con-datos--1440x900.png` | Plantilla genérica de panel de métricas con datos ficticios; no es la pantalla del rol investigador. |

Regeneración: `cd frontend && bun run capturar:criticas`, con Storybook disponible en `127.0.0.1:6104`.

## Qué falta y por qué

- **Capturas del sistema real y del rol investigador:** no existen; las figuras disponibles son del catálogo. El rol investigador se cubre hoy con el recorrido E2E descrito en `docs/pruebas/e2e-flujos.md`, no con una captura del despliegue. Las produce el equipo durante una sesión autorizada, sin datos personales ni clínicos.
- **Medición de usabilidad UnUQ:** no hay respuestas de los 10 participantes; RNF-USA-01 y RP-07/RP-08 siguen pendientes en `docs/pruebas/matriz-de-pruebas.md`. La producen los tesistas con los evaluadores, tareas y consentimientos aprobados; no se sustituye con cifras ficticias.
- **Cobertura por suite:** `make check` no publica porcentaje; sin informe versionado no se puede citar una cifra de cobertura, solo el resultado de los gates.
- **Verificación en el servidor real:** 3 objetivos de `docs/operacion/matriz-verificacion.md` y la custodia externa de respaldos siguen sin ensayo en el host.
- **Escaneo de rutas autenticadas:** ZAP solo examinó la superficie anónima; las rutas autenticadas quedan cubiertas por pruebas de acceso, como declara `docs/cumplimiento/informe-seguridad.md`.

## Cómo citar

Forma recomendada: «[cifra exacta], según `ruta/del/artefacto`; regenerado con `comando`». Para evidencia que no existe todavía, escriba «no disponible en el repositorio» en lugar de convertir un objetivo o una captura sintética en un resultado medido.
