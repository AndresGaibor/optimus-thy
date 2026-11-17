# Plan de respuesta a incidentes (HT-081)

Cubre el requisito **RS-INC-03** del catálogo: plan escrito para detectar,
contener, evaluar, notificar y corregir. Es el procedimiento que usan las
plantillas de **RS-INC-04**, que viven en
[plantilla-notificacion-incidente.md](plantilla-notificacion-incidente.md).

**No es asesoría legal.** Las normas, los plazos y la autoridad son los que cita
`docs/referencia/04-requisitos/catalogo-de-requisitos.md`; este documento no
añade artículos ni interpreta la LOPDP. La calificación de un hecho como
vulneración, la decisión de notificar y los textos que salen del proyecto los
valida la **Dirección de tesis con asesoría jurídica de la ESPOCH**.

Estado: el plan está escrito y no se ha ejercitado. No hay alertas automáticas
(RS-INC-02), registro de incidentes en el sistema (RS-INC-05) ni simulacro
(RS-INC-06). El sistema opera hoy con datos sintéticos; antes de tratar datos
reales, el plan tiene que revisarse y probarse. Ver «Lo que todavía no existe».

## Qué se trata como incidente

Definición operativa del proyecto, no legal: cualquier hecho que ponga en duda
la confidencialidad, la integridad o la disponibilidad de los datos que gestiona
el sistema, o de las credenciales que los protegen.

| Tipo | Señal observable en este sistema |
| --- | --- |
| Acceso no autorizado | Sesión usada por otra persona, cuenta desactivada que sigue operando, lectura de un paciente de otra institución (`ACCESS_DENIED` en la bitácora) |
| Divulgación | Enlace firmado compartido fuera del equipo, archivo servido a quien no tiene permiso, identidad de un paciente descifrada sin justificación (`PII_REVEAL`) |
| Alteración | Cambio de rol, de permisos o de configuración que su dueño no reconoce (`USER_ROLE_CHANGE`, `PERMISSION_CHANGE`, `SETTINGS_CHANGE`) |
| Pérdida o destrucción | Volumen de PostgreSQL o MinIO perdido, respaldo que ya no se puede restaurar, clave GPG de respaldo perdida o expuesta |
| Credenciales comprometidas | Secreto de `.env`, clave de cifrado de identidad o clave de respaldo fuera del control del proyecto |
| Indisponibilidad con riesgo de integridad | Caída durante una migración o una restauración, servicios recreados sobre datos activos |
| Fallo del propio procedimiento | Rollback o limpieza ejecutada sobre un entorno distinto del previsto |

Un intento de acceso fallido aislado no es un incidente; un patrón de fallos sí,
pero hoy nada lo detecta de forma automática (RS-INC-02).

## Roles

| Rol | Quién lo ejerce | Qué decide o hace |
| --- | --- | --- |
| Quien detecta | Cualquier usuario u operador | Avisa, anota fecha y hora, no borra ni reinicia nada |
| Responsable técnico | Equipo del proyecto (Andrés Gaibor y Daniel Quiguiri, `README.md`) | Contiene, conserva evidencia, ejecuta la corrección y redacta el registro del incidente |
| Dirección de tesis | Diego Ávila Pesántez (`README.md`) | Califica el riesgo, decide si se notifica y aprueba cada texto antes de enviarlo |
| Asesoría jurídica | Asesoría jurídica de la ESPOCH | Interpreta la LOPDP y la Resolución SPDP-SPD-2026-0040-R; revisa plazos y contenido |
| Responsable y encargado del tratamiento | Por definir por escrito | Es la figura legal que notifica; el proyecto aún no tiene designación formal ni delegado de protección de datos (RS-LEG-06 pendiente) |

La tabla nombra roles, no autorizaciones. Mientras no exista una designación
escrita, la Dirección de tesis coordina la respuesta. La LOPDP distingue
«responsable» y «encargado»; qué papel ocupa el proyecto y qué papel la
institución de salud es una decisión jurídica pendiente y condiciona quién firma
cada notificación.

## Las cinco fases

| Fase | Objetivo | Responsable | Salida |
| --- | --- | --- | --- |
| 1. Detectar | Reconocer el hecho y fijar el momento en que se conoció | Quien detecta y el responsable técnico | Identificador del incidente y primer registro de evidencia |
| 2. Contener | Detener la causa sin destruir evidencia | Responsable técnico | Medidas aplicadas con hora y efecto |
| 3. Evaluar | Saber qué datos, cuántos titulares y qué riesgo hay | Responsable técnico; califica la Dirección de tesis | Evaluación escrita y decisión de notificar o no |
| 4. Notificar | Avisar a quien corresponde dentro del plazo legal | Dirección de tesis, con asesoría jurídica | Notificaciones enviadas y acuses |
| 5. Corregir | Eliminar la causa, verificar y dejar lecciones | Responsable técnico; aprueba la Dirección de tesis | Acciones correctivas y plan actualizado |

### 1. Detectar

Fuentes que existen hoy:

| Fuente | Qué aporta | Dónde |
| --- | --- | --- |
| Bitácora de solo escritura | Eventos con usuario, hora, origen, objeto y acción; no se pueden corregir ni borrar después | `backend/app/audit/actions.py`, `backend/app/audit/service.py`, `backend/alembic/versions/0005_auditoria_solo_escritura.py`, [auditoria.md](../arquitectura/auditoria.md) |
| Revisión manual de la bitácora | Patrones por ventana de tiempo: `LOGIN_FAILED` repetidos, `ACCESS_DENIED`, `PII_REVEAL`, `EXPORT`, cambios de rol o de permisos | `GET /auditoria` y la página `/administrador/auditoria` (HU-020: filtros por usuario, acción, fecha y recurso, paginación, solo la institución propia; cada consulta registra `AUDIT.AUDIT_READ`). La exportación sigue pendiente (HU-022) |
| Reporte interno | Alguien del equipo, un usuario o un operador nota algo raro | Comunicación directa al responsable técnico; no hay formulario ni buzón en la aplicación |
| Salud del despliegue | Caídas, errores 5xx, contenedores reiniciados, migraciones fallidas | Comprobaciones de solo lectura de [despliegue-produccion.md](../operacion/despliegue-produccion.md) |
| Respaldos | Respaldo fallido, huellas que no coinciden, restauración que no se puede verificar | [custodia-respaldos.md](../operacion/custodia-respaldos.md) |

Pasos:

1. Anotar fecha y hora del hallazgo, quién lo detectó y por qué fuente.
2. Abrir el registro del incidente con el identificador `INC-AAAA-MM-DD-nn` (ver
   «Evidencia por incidente»).
3. No borrar, reiniciar ni «limpiar» nada antes de copiar la evidencia.
4. Avisar al responsable técnico; si el hallazgo toca datos personales, avisar
   también a la Dirección de tesis el mismo día.
5. Revisar la bitácora del periodo para saber si el hecho viene de antes.

**Lo que no existe:** RS-INC-02 (alertas ante muchos fallos de acceso, descargas
masivas o exportaciones fuera de horario) no está implementado; su historia es
HT-086 y sigue pendiente. Hoy la detección depende de una revisión manual y de
que una persona avise.

### 2. Contener

1. Aislar lo afectado sin tocar volúmenes ni datos: retirar el servicio del
   borde o detener el contenedor correspondiente, nunca `docker compose down -v`
   (prohibido en [despliegue-produccion.md](../operacion/despliegue-produccion.md)).
2. Desactivar la cuenta implicada: `activo = false` rechaza el inicio de sesión y
   cada petición posterior (`backend/app/api/usuarios.py`,
   `backend/app/auth/deps.py`).
3. Cerrar las sesiones abiertas de esa cuenta marcando `sesiones.revocada_en` en
   la base. La aplicación solo cierra la sesión actual; el cierre remoto de todas
   las sesiones no está implementado (RS-ACC-06 parcial), así que este paso es
   manual y lo hace un operador con acceso a la base.
4. Si el compromiso alcanza credenciales, rotarlas siguiendo
   [custodia-respaldos.md](../operacion/custodia-respaldos.md): secreto de
   sesión, credenciales de base o de MinIO, clave de respaldo. Cambiar la clave
   de cifrado de identidad no es una rotación trivial: la clave vive en el
   entorno y cada fila de `identidades_paciente` guarda `clave_version`, así que
   el procedimiento tiene que planificarse antes de usarlo.
5. Conservar evidencia antes de reparar: copia de la bitácora del periodo,
   estado de contenedores, volúmenes y configuración efectiva (sin secretos), y
   las huellas de los respaldos disponibles.
6. Registrar cada medida con hora, responsable y efecto observado.

No hay «botón de pánico»: la contención combina funciones que existen (desactivar
usuario, revocar sesión, reiniciar un servicio) con operaciones manuales
documentadas en los runbooks. Todo lo que se haga a mano queda anotado en el
registro del incidente.

### 3. Evaluar

Responder por escrito, con lo que se sepa y marcando lo que está en
investigación:

| Pregunta | De dónde sale la respuesta |
| --- | --- |
| ¿Qué sistemas y tablas estuvieron expuestos? | Bitácora, logs e inventario de contenedores del runbook de despliegue |
| ¿Qué categorías de datos hay? | Modelos: identidad cifrada en `identidades_paciente`, datos clínicos en `fichas`, documentos e imágenes en sus tablas, consentimientos |
| ¿Cuántos titulares, aproximadamente? | Conteo sobre las tablas afectadas; se registra el número, nunca la lista |
| ¿Estaba la identidad cifrada y se comprometió la clave? | `backend/app/security/encryption.py` y el estado de la clave fuera del repositorio |
| ¿Hay riesgo para los derechos de los titulares? | Lo califica la Dirección de tesis con asesoría jurídica; el catálogo no define el umbral de «riesgo» |
| ¿Hubo pérdida, alteración o solo acceso? | Bitácora y comparación con los respaldos disponibles |
| ¿El hecho sigue activo? | Estado de contención de la fase 2 |

La salida es una evaluación escrita con la decisión de notificar o no y su
motivo. Esa decisión y su fecha quedan en el registro del incidente. **Ni el
responsable técnico ni este documento deciden solos si hubo vulneración:** esa
calificación es jurídica.

### 4. Notificar

Plazos que fija el catálogo (LOPDP, arts. 43 y 46, y Resolución
SPDP-SPD-2026-0040-R):

| A quién | Plazo | Norma citada por el catálogo | Plantilla |
| --- | --- | --- | --- |
| Del encargado al responsable | 2 días | LOPDP, arts. 43 y 46 | A |
| Del responsable a la autoridad de protección de datos personales, con reporte en el Sistema Nacional de Registro de Datos Personales | 5 días | LOPDP, arts. 43 y 46; Resolución SPDP-SPD-2026-0040-R (9 de septiembre de 2026) | B |
| Del responsable a los titulares, si hay riesgo para sus derechos | 3 días | LOPDP, arts. 43 y 46 | C |

El catálogo advierte que omitir el reporte en el Sistema Nacional de Registro de
Datos Personales es infracción grave.

Advertencias que el catálogo no resuelve y que hay que cerrar con asesoría
jurídica antes de usar el plan con datos reales:

- No dice si los días son hábiles o calendario ni desde qué hecho se cuentan
  (conocimiento, confirmación, contención). El registro del incidente guarda
  todas las fechas para poder justificar el cómputo.
- No fija el contenido del reporte a la autoridad; la plantilla B separa los
  campos que el catálogo exige de los que el proyecto propone.
- No designa a la persona que firma; la figura de responsable y encargado sigue
  pendiente (RS-LEG-06).

Pasos:

1. La Dirección de tesis, con asesoría jurídica, elige la plantilla y aprueba el
   texto.
2. Se rellena [plantilla-notificacion-incidente.md](plantilla-notificacion-incidente.md)
   sin datos personales reales: códigos de paciente y caso, números aproximados.
3. Se envía por el canal que corresponda y se guarda fecha, hora, destinatario y
   acuse.
4. Se anota el envío en el registro del incidente.
5. Si aparece información nueva, se envía una actualización; no se espera al
   cierre.

### 5. Corregir

1. Identificar la causa raíz, no solo el síntoma, y escribirla en una frase
   verificable.
2. Definir acciones correctivas con responsable y fecha, en una tabla como la de
   [incidente-e2e-rollback-2026-11-09.md](../operacion/incidente-e2e-rollback-2026-11-09.md).
3. Aplicar la corrección con una prueba que la demuestre; la matriz de pruebas
   es el sitio para esa evidencia.
4. Verificar que la corrección no deja el sistema en peor estado: salud, rutas
   críticas, datos y respaldo.
5. Anotar lecciones aprendidas y actualizar este plan, los runbooks o el código
   que corresponda.
6. Cerrar el incidente solo cuando la verificación esté hecha; el cierre lleva
   fecha y responsable.

El registro de incidentes y lecciones aprendidas como función del sistema
(RS-INC-05) no existe. Hasta que exista, el registro vive como documento
controlado del incidente, fuera de la aplicación y sin datos personales.

## Evidencia por incidente

Un documento por incidente, con este contenido mínimo:

| Campo | Qué se escribe |
| --- | --- |
| Identificador | `INC-AAAA-MM-DD-nn` |
| Fechas | Detección, contención, evaluación, cada notificación y cierre, con hora y zona |
| Sistemas afectados | Servicios, contenedores, tablas y objetos concretos |
| Categorías de datos | Qué tipo de dato estaba en juego: identidad, ficha clínica, imagen, documento o consentimiento |
| Titulares | Número aproximado; nunca la lista de personas |
| Medidas | Contención y corrección, con hora y efecto |
| Responsable | Rol que decide y rol que ejecuta cada paso |
| Decisiones | Notificar o no, con motivo, y quién lo aprobó |
| Comunicaciones | Plantilla usada, destinatario, fecha, hora y acuse |

La plantilla de notificación es
[plantilla-notificacion-incidente.md](plantilla-notificacion-incidente.md). El
registro no se guarda en la aplicación: RS-INC-05 sigue pendiente, así que el
documento se custodia fuera del repositorio y sin datos personales.

## Lo que todavía no existe

| Pieza | Estado | Qué implica para este plan |
| --- | --- | --- |
| RS-INC-01, bitácora completa de seguridad | En curso: falta que cada módulo llame al servicio | Un hecho puede no quedar registrado, aunque la bitácora que existe sea inmutable |
| RS-INC-02, alertas ante patrones raros (HT-086) | Pendiente | La detección es manual; un patrón puede pasar inadvertido hasta que alguien revise la bitácora |
| RS-INC-05, registro de incidentes y lecciones aprendidas | Pendiente | No hay histórico consultable ni estado por incidente dentro del sistema |
| RS-INC-06, simulacro con evidencia | Pendiente | El plan está escrito pero no probado; no se puede afirmar que funcione bajo presión |
| Exportación de la bitácora por la aplicación | Pendiente (HU-022) | La revisión ya se hace desde `/administrador/auditoria` (HU-020), pero no se puede exportar para conservar evidencia |
| Cierre remoto de todas las sesiones (RS-ACC-06) | Parcial | La contención de una sesión robada exige tocar la base a mano |
| Responsable de protección de datos designado (RS-LEG-06) | Pendiente | No hay figura con contacto visible que firme las notificaciones |
| Segundo factor (RS-ACC-02) | Pendiente | Una contraseña filtrada basta para abrir sesión; la contención depende de la detección |

## Runbooks que se usan, no se duplican

| Documento | Cuándo se usa en una respuesta | Qué aporta |
| --- | --- | --- |
| [despliegue-produccion.md](../operacion/despliegue-produccion.md) | Contención y corrección que tocan contenedores o entornos | Identidad obligatoria del entorno, guards, operaciones prohibidas y rollback conservador |
| [custodia-respaldos.md](../operacion/custodia-respaldos.md) | Pérdida de datos, clave expuesta, rotación o restauración | Custodia de la clave GPG, respaldos, rotación, mínimo privilegio y simulacros |
| [incidente-e2e-rollback-2026-11-09.md](../operacion/incidente-e2e-rollback-2026-11-09.md) | Incidente real y formato de registro | Línea de tiempo, causa raíz, impacto, límites de la evidencia y acciones correctivas |
| [despliegue-tiroides2.md](../operacion/despliegue-tiroides2.md) | Despliegue concreto en el servidor | Corte y operación del entorno desplegado |

## Incidente ya documentado

El único incidente registrado en el repositorio es el del 2026-11-09: una
ejecución de rollback E2E recreó contenedores de producción. Se documentó con
línea de tiempo, causa raíz, impacto, límites de la evidencia y acciones
correctivas. Ese documento no demuestra que este plan se haya seguido: es
anterior al plan y no hubo simulacro. Sirve como formato de referencia y como
recordatorio de que el fallo del propio procedimiento también es un incidente.

## Revisión

Este plan se valida con la Dirección de tesis y asesoría jurídica antes de tratar
datos reales. Queda pendiente un simulacro (RS-INC-06) que lo ejercite y deje
evidencia. La matriz de pruebas registra el requisito en
[matriz-de-pruebas.md](../pruebas/matriz-de-pruebas.md) (RS-INC-03, CP-115 y
RS-INC-04) y las obligaciones legales en
`docs/referencia/04-requisitos/catalogo-de-requisitos.md`.
