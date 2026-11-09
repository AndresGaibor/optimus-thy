# OPTIMUS-THY: decisiones de la conversación

Fecha de corte: 20 de octubre de 2026.
Equipo: Andrés Gaibor y Daniel Quiguiri (tesistas, ESPOCH). Director: Diego Ávila Pesántez.

Este archivo reúne lo que se decidió, aclaró o dejó pendiente durante el trabajo con Claude, para que no dependa de la memoria del chat.

## 1. Objetivo

Cumplir el anteproyecto aprobado de OPTIMUS-THY (sistema web de gestión de datos clínicos con integración de IA para cáncer de tiroides). El repositorio de referencia `AndresGaibor/optimus-thy-referencia` es solo un mockup y solo lectura: no se marca nada como hecho y todo se construye desde cero en un repositorio nuevo llamado `optimus`.

Meta inmediata de la conversación: tener claros los requisitos, las historias de usuario y técnicas, y el backlog listo. Después vienen los pull requests.

## 2. Método y calendario

- Metodología: Kanban, sin sprints. Estados: Pendiente, En proceso, Revisión, Finalizado.
- Límites de trabajo en curso: En proceso 2 por persona, Revisión 3.
- Ventana de trabajo: del 13 de octubre al 23 de diciembre de 2026. La conversación empezó el 20 de octubre y todavía no existía código.
- Las semanas de implementación no llevan historias nuevas ni backlog: el backlog se cierra antes.
- Capacidad: 2 personas, unas 30 h por semana cada una, factor de foco 80 %. Capacidad total estimada: 446 h.
- Los "tramos" S1 a S5 son bloques de tiempo del tablero, no sprints:
  - S1: 13 a 26 oct (48 h)
  - S2: 27 oct a 9 nov (96 h)
  - S3: 10 a 23 nov (96 h)
  - S4: 24 nov a 7 dic (96 h)
  - S5: 8 a 23 dic (110 h)

## 3. Estimación

- Se usan horas, no puntos ("así están presentando todos").
- Primera versión: escala 2, 4, 6, 10, 16 h.
- Se pidió bajar los tiempos porque "es mucho y nos van a rechazar". Se asumió trabajo con IA y se redujo a la mitad: escala 1, 2, 3, 5, 8 h. Una historia de más de 8 h se parte.
- HU-110 (evaluación de usabilidad UnUQ) quedó en 8 h.
- Regla de corrección: si el flujo medido en las primeras dos semanas muestra que la IA ayuda menos de lo supuesto, se corrige el factor antes de S3.

## 4. Cifras vigentes del plan

- 119 historias: 61 de usuario (HU) y 58 técnicas (HT), en 15 épicas (E00 a E14).
- Obligatorias (M): 214 h de 446 h de capacidad (48 %).
- Si hay espacio (S): 54 h. Podría (C): 15 h. Total: 283 h.
- Cargas obligatorias por tramo: S1 21 h, S2 48 h, S3 48 h, S4 47 h, S5 50 h. Margen total aproximado: 232 h.
- "S5 si hay espacio": 5 h (HU-073, HU-100, HT-084).
- La holgura sirve de colchón para lo que la IA no acelera (integración con modelos, OCR con fichas reales, depuración) y para esperas de terceros (evaluadores, director).

## 5. Decisiones sobre el alcance

1. **Asistencia local: no se construye.** El Gantt del anteproyecto (actividad 19) nombra "integrar asistencia local", pero ningún objetivo ni módulo la pide y el cronograma es referencial. La ayuda al médico queda cubierta con mensajes claros en pantalla y el glosario. Se eliminó la historia HU-120.
2. **Verificación de modelos: nada en este chat.** Se eliminó HT-060 (cargar los tres modelos y medir el tiempo en CPU). HT-061 ya no depende de ella. La primera medida de tiempo ocurre al integrar HT-061 en la laptop de la demostración (riesgo R2).
3. **"Normal" significa "sin nódulo detectado".** Confirmado por Andrés. Falta el visto bueno del director.
4. **Imágenes anonimizadas.** Están anonimizadas (sin datos del paciente). Falta dejar por escrito su origen y permiso, y revisar una muestra por si traen texto grabado (HT-094). Pacientes y fichas se generan sintéticos y se emparejan con las imágenes.
5. **Administradores en la evaluación UnUQ.** Participan como evaluadores: 22 ítems, 7 atributos, 10 evaluadores (médicos, investigadores y administradores), meta de al menos 70 puntos (propuesta nuestra, "Bueno" en la escala del artículo).
6. **Seguridad y ley.** Se pidió cubrir seguridad completa: anonimización, LOPDP de Ecuador (respuesta a derechos en 15 días), protección de datos, bitácora de auditoría. Es orientación técnica, no asesoría legal. La épica E12 recoge estos requisitos. HT-083 (informe de pruebas de seguridad) pasó a "Después".
7. **Diseño.** Se pidió hacer bien el diseño con un sistema de diseño propio (tokens, tema claro y oscuro, componentes). No sale del anteproyecto; sostiene la medición de usabilidad (CA-17). Épica E01.
8. **Catálogo de requisitos sin columna "Origen".** Se quitaron las letras A, D, U y P porque confundían. Con ellas se fueron las referencias CA-xx por requisito. Los 21 compromisos (CA-01 a CA-21) siguen en su propia tabla con la evidencia de cumplimiento. Si hace falta, se puede volver a poner una columna "Compromiso" sin letras.

## 6. Decisiones técnicas

- Frontend: React + TypeScript + Vite.
- Backend: Python con FastAPI, SQLAlchemy y Alembic.
- Base de datos: PostgreSQL. Archivos: almacenamiento compatible con S3 (RustFS o MinIO).
- OCR local: Tesseract en español + PyMuPDF + reglas por campo. Sin servicios externos.
- Servicio de IA aparte: se convierte `base.py` (cadena YOLO, MGAC, BGAU-Net, Swin) en una función que recibe una imagen y devuelve un resultado, sin rutas fijas ni variables globales. Reemplaza al `app.py` de Streamlit. Debe dar los mismos resultados que `app.py` con imágenes de ejemplo y aceptar hasta 3 nódulos por imagen.
- Pesos de los modelos: Andrés los tiene todos (se subió `best_bgaunet.keras`).
- Entorno: Docker Compose con un solo comando. Hardware de la demostración: laptop sin GPU.
- Tablero: GitHub Projects. Pruebas: pytest, Vitest, Playwright.
- Cuatro módulos aprobados; compromisos CA-01 a CA-21; prioridad MoSCoW.

## 7. Pendientes

De Andrés o del director:
- Visto bueno del director a la definición de "normal" (sin nódulo detectado).
- Lista de los 10 evaluadores del UnUQ con sus fechas.
- De 3 a 5 fichas reales anonimizadas.
- Confirmar que ambos tesistas tienen acceso al repositorio nuevo.
- Dejar por escrito el origen y permiso de uso de las imágenes.
- Decir qué se avanzó realmente entre el 13 y el 20 de octubre, para ajustar S1.

Del trabajo:
- Crear el repositorio `optimus`.
- Cargar el tablero Kanban (HT-008) con `05-backlog/backlog-tarjetas-kanban.csv`.
- Abrir los primeros pull requests, uno por historia y en este orden: HT-001 (estructura), HT-002 (entorno de un comando), HT-003 (integración continua), HT-004 (backend), HT-005 (frontend), HT-020 (tokens de diseño) y HT-094 (revisión de imágenes).

## 8. Primera semana (tramo S1, 21 h obligatorias)

HT-001 repositorio (2 h), HT-008 tablero Kanban, HT-002 entorno de un comando, HT-003 integración continua, HT-004 backend, HT-005 frontend, HT-020 tokens de diseño, HT-094 revisión de imágenes. Con HT-001 hecho, HT-002 a HT-005 pueden avanzar en paralelo. Reparto sugerido: una persona en repositorio, Kanban, Docker, integración continua y backend; la otra en frontend, tokens de diseño y revisión de imágenes.

## 9. Documentos en vivo

Estos dos documentos se editaron en Claude y este paquete trae su exportación al 20 de octubre:
- Catálogo de requisitos: `04-requisitos/`.
- De los requisitos al backlog (15 épicas, historias, tramos, riesgos, siguientes pasos): `05-backlog/`.
