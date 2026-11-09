# Pila del producto (backlog) — 7255 / 7270

Fuente: `Pila_Producto_Backlog_7255_7270.xlsx`. Conversión literal de las hojas del libro; los datos son de planificación, no datos clínicos.

## Pila del producto

Título de la hoja original: PILA DEL PRODUCTO BACKLOG.

| # | ID | Título | Tipo | Estimación | Prioridad | Dependencias | Hecho | Tramo | Inicio | Fin | Estimación total |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | HT-001 | Repositorio y estructura del proyecto | Técnica | 2 | Alta | Ninguna | Sí | Tramo 1 (13 a 26 oct) | 2026-10-13 | 2026-10-13 | =SUM(E3:E10) |
| 2 | HT-002 | Entorno local con un solo comando | Técnica | 5 | Alta | HT-001 | No |  | 2026-10-22 | 2026-10-24 |  |
| 3 | HT-003 | Integración continua | Técnica | 3 | Alta | HT-001 | No |  | 2026-10-16 | 2026-10-17 |  |
| 4 | HT-004 | Esqueleto del backend | Técnica | 3 | Alta | HT-001 | Sí |  | 2026-10-15 | 2026-10-16 |  |
| 5 | HT-005 | Esqueleto del frontend | Técnica | 3 | Alta | HT-001 | Sí |  | 2026-10-19 | 2026-10-20 |  |
| 6 | HT-008 | Tablero Kanban en GitHub Projects | Técnica | 1 | Alta | HT-001 | No |  | 2026-10-14 | 2026-10-14 |  |
| 7 | HT-020 | Principios de diseño y tokens | Técnica | 3 | Alta | Ninguna | No |  | 2026-10-20 | 2026-10-21 |  |
| 8 | HT-094 | Revisión de las imágenes anonimizadas | Técnica | 1 | Alta | Ninguna | No |  | 2026-10-14 | 2026-10-14 |  |
| 9 | HT-006 | Modelo de datos v1 | Técnica | 5 | Alta | HT-004 | No | Tramo 2 (27 oct a 9 nov) | 2026-10-27 | 2026-10-28 | =SUM(E11:E25) |
| 10 | HT-007 | Almacenamiento de archivos compatible con S3 | Técnica | 3 | Alta | HT-002 | No |  | 2026-10-29 | 2026-10-29 |  |
| 11 | HT-011 | Cifrado en reposo y gestión de claves | Técnica | 2 | Alta | HT-006 | No |  | 2026-10-28 | 2026-10-28 |  |
| 12 | HT-021 | Biblioteca de componentes base | Técnica | 5 | Alta | HT-020 | Sí |  | 2026-10-31 | 2026-11-01 |  |
| 13 | HT-024 | Diseño de las pantallas clave | Técnica | 3 | Alta | Ninguna | Sí |  | 2026-10-29 | 2026-10-30 |  |
| 14 | HT-030 | Servicio de auditoría | Técnica | 5 | Alta | HT-006 | No |  | 2026-10-30 | 2026-10-31 |  |
| 15 | HT-061 | Servicio de IA a partir de base.py | Técnica | 8 | Alta | Ninguna | No |  | — | — |  |
| 16 | HT-062 | Carga única de modelos y chequeo de salud | Técnica | 2 | Alta | HT-061 | No |  | — | — |  |
| 17 | HT-090 | Generador de pacientes y fichas sintéticos | Técnica | 3 | Alta | Ninguna | No |  | — | — |  |
| 18 | HT-100 | Matriz de pruebas y registro de errores | Técnica | 1 | Alta | Ninguna | No |  | 2026-10-28 | 2026-10-28 |  |
| 19 | HU-001 | Inicio de sesión | Usuario | 3 | Alta | HT-005, HT-006 | No |  | — | — |  |
| 20 | HU-002 | Cierre de sesión | Usuario | 1 | Alta | HU-001 | No |  | — | — |  |
| 21 | HU-010 | Gestión de usuarios | Usuario | 3 | Alta | HU-001 | No |  | — | — |  |
| 22 | HU-011 | Gestión de roles y permisos | Usuario | 3 | Alta | HU-010 | No |  | — | — |  |
| 23 | HU-012 | Varios roles por usuario | Usuario | 1 | Alta | HU-011 | No |  | — | — |  |
| 24 | HT-010 | Trabajos en segundo plano | Técnica | 2 | Alta | HT-004 | No | Tramo 3 (10 a 23 nov) | — | — | =SUM(E26:E45) |
| 25 | HT-012 | Proxy inverso con TLS | Técnica | 2 | Alta | HT-002 | No |  | — | — |  |
| 26 | HT-022 | Patrones clínicos reutilizables | Técnica | 3 | Alta | HT-021 | No |  | — | — |  |
| 27 | HT-025 | Guía de contenido y glosario clínico | Técnica | 1 | Alta | Ninguna | No |  | — | — |  |
| 28 | HT-063 | Integración de la API con el servicio de IA | Técnica | 5 | Alta | HT-061, HT-010, HT-007 | No |  | — | — |  |
| 29 | HT-080 | Documentos de cumplimiento | Técnica | 3 | Alta | Ninguna | No |  | — | — |  |
| 30 | HT-091 | Fichas PDF digitales | Técnica | 2 | Alta | HT-090 | No |  | — | — |  |
| 31 | HT-092 | Fichas escaneadas | Técnica | 1 | Alta | HT-091 | No |  | — | — |  |
| 32 | HT-093 | Conjunto de referencia del OCR | Técnica | 1 | Alta | HT-091 | No |  | — | — |  |
| 33 | HU-003 | Elección del rol activo | Usuario | 2 | Alta | HU-001, HU-012 | No |  | — | — |  |
| 34 | HU-013 | Permisos por operación y denegaciones | Usuario | 3 | Alta | HU-011 | No |  | — | — |  |
| 35 | HU-030 | Registro de paciente | Usuario | 3 | Alta | HT-011, HU-013 | No |  | — | — |  |
| 36 | HU-031 | Búsqueda de pacientes | Usuario | 2 | Alta | HU-030 | No |  | — | — |  |
| 37 | HU-033 | Apertura de casos | Usuario | 2 | Alta | HU-030 | No |  | — | — |  |
| 38 | HU-034 | Consentimiento del paciente | Usuario | 3 | Alta | HU-030, HT-080 | No |  | — | — |  |
| 39 | HU-035 | Bloqueo sin consentimiento vigente | Usuario | 1 | Alta | HU-034 | No |  | — | — |  |
| 40 | HU-040 | Ficha clínica por secciones | Usuario | 5 | Alta | HU-033 | No |  | — | — |  |
| 41 | HU-041 | Validación de la ficha | Usuario | 2 | Alta | HU-040 | No |  | — | — |  |
| 42 | HU-060 | Carga de ecografías | Usuario | 3 | Alta | HT-007, HU-033 | No |  | — | — |  |
| 43 | HT-050 | Limpieza de metadatos de las imágenes | Técnica | 2 | Alta | HU-060 | No |  | — | — |  |
| 44 | HT-040 | Servicio de OCR local | Técnica | 5 | Alta | HT-002 | No | Tramo 4 (24 nov a 7 dic) | — | — | =SUM(E46:E63) |
| 45 | HT-041 | Extracción de campos por reglas | Técnica | 3 | Alta | HT-040, HT-091 | No |  | — | — |  |
| 46 | HT-043 | Medición de la calidad del OCR | Técnica | 2 | Alta | HT-041, HT-093 | No |  | — | — |  |
| 47 | HT-051 | Detección de texto incrustado en la ecografía | Técnica | 3 | Alta | HT-040, HT-050 | No |  | — | — |  |
| 48 | HT-064 | Resultado normal sin nódulo detectado | Técnica | 2 | Alta | HT-063 | No |  | — | — |  |
| 49 | HU-004 | Bloqueo por intentos fallidos | Usuario | 1 | Alta | HU-001 | No |  | — | — |  |
| 50 | HU-005 | Expiración de sesión por inactividad | Usuario | 1 | Alta | HU-001 | No |  | — | — |  |
| 51 | HU-020 | Consulta de la bitácora | Usuario | 3 | Alta | HT-030 | No |  | — | — |  |
| 52 | HU-050 | Carga de fichas clínicas | Usuario | 3 | Alta | HT-007, HU-033 | No |  | — | — |  |
| 53 | HU-051 | Estado del OCR | Usuario | 1 | Alta | HT-010, HU-050 | No |  | — | — |  |
| 54 | HU-052 | Revisión lado a lado del OCR | Usuario | 5 | Alta | HT-041, HT-022, HU-040 | No |  | — | — |  |
| 55 | HU-053 | Visualización y descarga de documentos | Usuario | 1 | Alta | HU-050 | No |  | — | — |  |
| 56 | HU-070 | Ejecución de la inferencia | Usuario | 3 | Alta | HT-063, HU-035, HU-060 | No |  | — | — |  |
| 57 | HU-071 | Resultado por nódulo | Usuario | 5 | Alta | HU-070, HT-022 | No |  | — | — |  |
| 58 | HU-072 | Historial de inferencias | Usuario | 1 | Alta | HU-070 | No |  | — | — |  |
| 59 | HU-080 | Reporte PDF de una inferencia | Usuario | 5 | Alta | HU-071 | No |  | — | — |  |
| 60 | HU-081 | Consulta de resultados guardados | Usuario | 2 | Alta | HU-072 | No |  | — | — |  |
| 61 | HU-082 | Descarga registrada del reporte | Usuario | 1 | Alta | HU-080 | No |  | — | — |  |
| 62 | HT-013 | Respaldo y restauración | Técnica | 3 | Alta | HT-007 | No | Tramo 5 (8 a 23 dic) | — | — | =SUM(E64:E82) |
| 63 | HT-023 | Accesibilidad WCAG 2.2 AA | Técnica | 2 | Alta | HT-021 | No |  | — | — |  |
| 64 | HT-070 | Anonimización de datasets | Técnica | 3 | Alta | HU-035 | No |  | — | — |  |
| 65 | HT-081 | Plan de respuesta a incidentes | Técnica | 1 | Alta | Ninguna | No |  | — | — |  |
| 66 | HT-082 | Defensas de la aplicación | Técnica | 3 | Alta | HT-004 | No |  | — | — |  |
| 67 | HT-101 | Pruebas de integración | Técnica | 3 | Alta | HT-063, HT-040, HT-007 | No |  | — | — |  |
| 68 | HT-102 | Ejecución de la matriz de pruebas | Técnica | 3 | Alta | HT-100 | No |  | — | — |  |
| 69 | HT-103 | Prueba de extremo a extremo | Técnica | 3 | Alta | Ninguna | No |  | — | — |  |
| 70 | HT-105 | Matriz de trazabilidad | Técnica | 1 | Alta | Ninguna | No |  | — | — |  |
| 71 | HU-021 | Estados de carga, vacío y error | Usuario | 2 | Alta | HT-021 | No |  | — | — |  |
| 72 | HU-032 | Corrección de datos del paciente | Usuario | 2 | Alta | HU-030 | No |  | — | — |  |
| 73 | HU-042 | Historial de cambios de la ficha | Usuario | 2 | Alta | HU-040 | No |  | — | — |  |
| 74 | HU-090 | Consulta de datasets anonimizados | Usuario | 3 | Alta | HT-070 | No |  | — | — |  |
| 75 | HU-091 | Métricas del modelo | Usuario | 3 | Alta | HU-090, HU-072 | No |  | — | — |  |
| 76 | HU-092 | Comparación de resultados | Usuario | 2 | Alta | HU-091 | No |  | — | — |  |
| 77 | HU-093 | Auditoría de predicciones | Usuario | 2 | Alta | HU-091 | No |  | — | — |  |
| 78 | HU-094 | Análisis de errores | Usuario | 2 | Alta | HU-091 | No |  | — | — |  |
| 79 | HU-095 | Exportación anonimizada | Usuario | 2 | Alta | HU-091, HT-070 | No |  | — | — |  |
| 80 | HU-110 | Medición de usabilidad con el UnUQ | Usuario | 8 | Alta | Ninguna | No |  | — | — |  |
| 81 | HT-084 | Evaluación de impacto en protección de datos | Técnica | 2 | Media | HT-080 | No | S5 si hay espacio (8 a 23 dic) | — | — | =SUM(E83:E85) |
| 82 | HU-073 | Conclusión del médico | Usuario | 2 | Media | HU-071 | No |  | — | — |  |
| 83 | HU-100 | Solicitudes de derechos de titulares | Usuario | 1 | Media | HU-020 | No |  | — | — |  |
| 84 | HT-009 | Contrato OpenAPI versionado | Técnica | 2 | Media | HT-004 | No | Después (fuera del plazo) | — | — | =SUM(E86:E121) |
| 85 | HT-014 | Documentación de arquitectura | Técnica | 2 | Media | Ninguna | No |  | — | — |  |
| 86 | HT-026 | Regla automática de tokens | Técnica | 1 | Media | HT-020 | No |  | — | — |  |
| 87 | HT-027 | Diseño adaptable | Técnica | 2 | Media | Ninguna | No |  | — | — |  |
| 88 | HT-031 | Integridad de la bitácora | Técnica | 2 | Baja | HT-030 | No |  | — | — |  |
| 89 | HT-042 | Campos adicionales del OCR | Técnica | 2 | Media | HT-041 | No |  | — | — |  |
| 90 | HT-044 | Huella del archivo y duplicados | Técnica | 1 | Media | HU-050 | No |  | — | — |  |
| 91 | HT-065 | Validación de que la imagen sea una ecografía tiroidea | Técnica | 2 | Media | HT-063 | No |  | — | — |  |
| 92 | HT-066 | Explicación visual con Grad-CAM | Técnica | 3 | Baja | Ninguna | No |  | — | — |  |
| 93 | HT-071 | Riesgo de reidentificación con k-anonimato | Técnica | 2 | Media | HT-070 | No |  | — | — |  |
| 94 | HT-083 | Pruebas de seguridad con informe | Técnica | 3 | Media | HT-082 | No |  | — | — |  |
| 95 | HT-085 | Retención, borrado y separación de entornos | Técnica | 2 | Media | Ninguna | No |  | — | — |  |
| 96 | HT-086 | Alertas ante patrones raros de uso | Técnica | 2 | Baja | HT-030 | No |  | — | — |  |
| 97 | HT-104 | Medición de rendimiento en la laptop de la demostración | Técnica | 2 | Media | Ninguna | No |  | — | — |  |
| 98 | HT-106 | Evidencias para los capítulos de resultados | Técnica | 2 | Media | Ninguna | No |  | — | — |  |
| 99 | HU-006 | Cambio de contraseña y perfil | Usuario | 2 | Media | HU-001 | No |  | — | — |  |
| 100 | HU-007 | Segundo factor de autenticación | Usuario | 3 | Media | HU-001 | No |  | — | — |  |
| 101 | HU-008 | Restablecimiento de contraseña | Usuario | 1 | Baja | HU-010 | No |  | — | — |  |
| 102 | HU-014 | Gestión de instituciones | Usuario | 1 | Media | HU-010 | No |  | — | — |  |
| 103 | HU-015 | Tablero del administrador | Usuario | 2 | Baja | HU-020 | No |  | — | — |  |
| 104 | HU-016 | Ajustes no sensibles del sistema | Usuario | 1 | Baja | Ninguna | No |  | — | — |  |
| 105 | HU-022 | Exportación de la bitácora | Usuario | 1 | Media | HU-020 | No |  | — | — |  |
| 106 | HU-036 | Pacientes por institución | Usuario | 2 | Media | HU-014 | No |  | — | — |  |
| 107 | HU-037 | Archivado de pacientes | Usuario | 2 | Media | HU-030 | No |  | — | — |  |
| 108 | HU-038 | Aviso de posible duplicado | Usuario | 1 | Media | HU-030 | No |  | — | — |  |
| 109 | HU-039 | Exportación de datos del paciente | Usuario | 2 | Media | HU-033 | No |  | — | — |  |
| 110 | HU-043 | Cronología del caso | Usuario | 2 | Media | HU-040 | No |  | — | — |  |
| 111 | HU-044 | Cierre de ficha | Usuario | 1 | Baja | HU-040 | No |  | — | — |  |
| 112 | HU-054 | Reintento del OCR | Usuario | 1 | Media | HU-051 | No |  | — | — |  |
| 113 | HU-055 | Aviso de baja calidad del escaneo | Usuario | 1 | Baja | HU-050 | No |  | — | — |  |
| 114 | HU-061 | Visor de imágenes | Usuario | 2 | Media | HT-022 | No |  | — | — |  |
| 115 | HU-062 | Varias imágenes por caso | Usuario | 1 | Media | HU-060 | No |  | — | — |  |
| 116 | HU-074 | Explicación y límites del modelo | Usuario | 1 | Media | HU-071 | No |  | — | — |  |
| 117 | HU-083 | Reporte consolidado del caso | Usuario | 2 | Baja | HU-080 | No |  | — | — |  |
| 118 | HU-096 | Cohortes de investigación | Usuario | 3 | Media | HU-091 | No |  | — | — |  |
| 119 | HU-097 | Curva ROC y distribución de probabilidades | Usuario | 2 | Media | HU-091 | No |  | — | — |  |
|  |  | Total |  | =SUM(E3:E121) |  |  |  |  | — | — |  |
