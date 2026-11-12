# Repositorios y sincronización entre académico y producción

El proyecto vive en dos repositorios Git con historia independiente: uno académico, donde se produce la tesis y el software de referencia, y uno operativo, donde vive el software desplegado en `tiroides2.andresgaibor.com`. Lo que se comparte no se hereda por dependencia técnica ni por fusión de ramas: se copia de forma explícita, revisada y registrada en un commit concreto.

La decisión vigente es el [ADR-012](../adr/ADR-012-repo-produccion.md): `optimus` conserva tesis, requisitos, backlog y evidencia; `optimus-thy` es el repositorio de entrega y producción, creado como snapshot del académico con historia raíz propia. Este documento describe cómo se relacionan ambos repositorios, qué se comparte y qué permanece independiente.

Los dos son monorepos con la misma distribución de carpetas —`frontend/`, `backend/`, `ia/`, `ocr/`, `contracts/`, `infra/` y `docs/`—, de modo que cada ruta es reconocible en ambas ediciones y una diferencia concreta se puede señalar sin traducir estructuras.

## Los dos repositorios

| Repositorio | Rol | Historia | Remoto |
| --- | --- | --- | --- |
| `optimus` | Académico: tesis, requisitos, backlog, evidencia y código de referencia | Historia propia, desde el inicio del proyecto | `AndresGaibor/optimus` |
| `optimus-thy` (este) | Operativo: software desplegado en `tiroides2.andresgaibor.com` | Historia raíz propia desde el snapshot `a8ac2ad`, cuya base académica es `66e5b8d`, y commits posteriores propios de la edición | `AndresGaibor/optimus-thy` |

El repositorio operativo no hereda la historia académica: su primer commit es raíz y su árbol arranca del contenido exacto del commit académico `66e5b8d`. Desde ese snapshot ha añadido historia propia —endurecimiento de despliegue, despliegue por releases, tablero de Linear— sin recibir ningún commit del académico. Por eso los números de commit de un repositorio no significan nada en el otro y la correspondencia siempre se expresa como un par de commits.

La asimetría entre ediciones también es real en la documentación, y no es un olvido del académico: el operativo tiene material que el académico no tiene —los ADR-018 (despliegue por releases) y ADR-019 (respaldos cifrados), el manual `docs/operacion/` completo (incluido `sincronizar-academico.md` y el lock `academico-snapshot.json`) y `infra/deploy/`—, mientras que el académico conserva material de tesis que el operativo no tiene (`docs/referencia/02-proyecto-de-investigacion/LEEME.md`, `docs/referencia/05-backlog/backlog-linear.md` y `backlog-linear.csv`). Cada lado mantiene lo suyo y no se espera que el otro lo replique.

Estado medido el 2026-11-12:

- Académico: `164d18b`, 220 commits.
- Operativo (`main`): `511f728`, 22 commits. La rama de trabajo `sync/academico-2026-11-12` de este repositorio añade un commit sobre esa base (`d61ce86`, con los flujos de historia clínica, OCR documental e inferencia de IA) y encima la sincronización en curso.
- `make sync-plan`, ejecutado en el operativo, clasifica 273 rutas distintas entre el académico y `main` del operativo; la misma comparación contra `d61ce86`, la rama `sync/academico-2026-11-12` antes de esta sincronización, reporta 174 rutas.

Toda esa diferencia es trabajo posterior a la bifurcación, no divergencia de contenido heredado, y la cifra cuenta rutas, no archivos: un mismo archivo aparece una sola vez aunque haya cambiado muchas veces. El reparto por prefijo de esas rutas es: frontend 134, backend 42, docs 27, ia 23, ocr 17, infra 11, raíz 12, scripts 3, `.github` 3, contracts 1; la suma coincide con las 273 rutas. Cada ruta cae además en uno de los grupos de la política —`COPIAR`, `ADAPTAR`, `INDEPENDIENTE` o `SIN_REGLA`—, y ese grupo, no el prefijo, es lo que decide qué se copia y qué se toca a mano.

## Qué se comparte y qué no

| Componente | Tratamiento |
| --- | --- |
| Modelos de dominio | Compartido, por propagación explícita |
| `contracts/openapi.json` | Compartido; es el contrato canónico del API |
| Validaciones | Compartidas cuando la regla es la misma en ambas ediciones |
| Motor OCR (`ocr/`) | Compartido |
| Integración con el modelo de IA (`ia/`) | Compartida |
| Servicios de negocio | Compartidos solo cuando las reglas coinciden exactamente |
| Componentes UI | Compartidos cuando son reutilizables sin cambios |
| Roles y permisos | Independiente: cada edición define los suyos |
| Pantallas específicas | Independientes |
| Flujos institucionales | Independientes |
| Configuración de despliegue | Independiente: `docker-compose.yml`, infraestructura y variables de entorno propios |
| Documentación de tesis | Independiente: el académico es la fuente y la conserva; el operativo mantiene la copia heredada del snapshot |
| Manuales operativos | Independientes: cada edición mantiene los suyos; el operativo tiene el despliegue por releases y los respaldos cifrados, el académico su nota de despliegue de `tiroides2` |
| Datos y credenciales | Siempre independientes, sin excepción |

Compartir significa copia revisada en un commit concreto, nunca dependencia en tiempo de build ni bifurcaciones del tipo `if EDITION == ...`: cuando las reglas difieren, se escribe en la edición correspondiente un servicio o un adaptador propio en lugar de condicionar el código común. La lista no ordena importancia, sino fuente de verdad: una pieza compartida tiene su fuente en el académico y una independiente la tiene en la edición que la usa.

En el caso de `contracts/openapi.json`, el contrato compartido viaja con el cliente TypeScript que se genera a partir de él; el CI falla si ambos se desincronizan (ADR-003). Copiar el contrato sin copiar y regenerar el cliente deja la edición en un estado que los gates rechazan.

## Por qué no un tercer repositorio con el código común

La idea de un repositorio «núcleo» compartido por ambos ha sido descartada. Las razones, en orden de peso:

1. El monorepo modular ya está decidido (ADR-001, ADR-017) y `frontend/`, `backend/`, `ia/`, `ocr/` y `contracts/` se consumen por ruta dentro del mismo árbol: `docker-compose.yml` construye cada servicio desde su directorio, `make up` levanta el conjunto y el CI ejecuta los gates sobre esas mismas rutas. Extraer el núcleo obligaría a reconstruir dos builds y dos compose para un solo producto.
2. Git Subtree dejaría una segunda copia física de `ocr/`, `ia/`, `contracts/` y `frontend/` en cada edición, y los gates (`make check`, `ui:check`, catálogo de Storybook) tendrían que cubrir ambas copias para no quedar ciegos a una de ellas.
3. No hay cadencia de releases de un núcleo: hay dos consumidores y un solo equipo. El coste de mantener un repositorio con tags, versionado semántico y pipeline propio supera el de sincronizar 273 rutas con un runbook ya escrito.
4. La tesis exige auto-contención: clonar, instalar y ejecutar sin un tercer repositorio ni servicios privados. El snapshot ya lo garantiza, sin pasos adicionales que el revisor pueda omitir.
5. Los historiales son independientes a propósito (ADR-012) y subtree traería historia ajena al árbol de la edición, lo que vuelve ambiguo qué commit representa «el» estado del producto.
6. `cherry-pick` obliga a clasificar a mano cada commit compartido, y con la divergencia actual deja de ser barato.

Si apareciera un tercer consumidor real o un equipo distinto manteniendo la base, la decisión se revisa; hoy no. Mientras esas condiciones no se cumplan, el tercer repositorio añadiría coordinación sin resolver ningún problema que el runbook actual no cubra.

## Cómo se sincroniza

La sincronización es un acto deliberado, con un commit de origen, un commit de destino y una comparación registrada. No hay webhooks, submódulos ni copias automáticas entre los dos repositorios.

La clasificación de rutas está versionada en `scripts/sincronizacion.json` —reglas `compartido`, `adaptar` e `independiente`, cada una con su motivo— y se aplica con `scripts/sincronizar.py`, que copia solo lo que la política marca como compartido y nunca decide por su cuenta. Cambiar qué se comparte es cambiar ese archivo, no improvisar al copiar.

1. Las correcciones nacen en el académico y llegan a `main` por PR con CI en verde.
2. El operativo adopta una base académica mediante un snapshot exacto: `git archive` de un commit, nunca el working tree; commit raíz con historia propia y verificación de que el `tree` resultante es igual al del académico; el identificador queda registrado en `docs/operacion/academico-snapshot.json`.
3. Los cambios de producción que deban volver al académico regresan como PR acotado por paths, con autorización explícita y revisión; nunca de forma automática.
4. Antes y después de cada sincronización se ejecuta `make sync-verificar` en el operativo: exige cero rutas pendientes de copiar, comprueba el contrato compartido y, con `--registrar`, deja el par commit-tree comparado en `docs/operacion/academico-sync-ultimo.json`.
5. Nunca se trasladan `.env`, secretos, credenciales, `node_modules`, artefactos locales, pesos de modelos ni bases de datos.

El snapshot no arrastra el directorio `.git`: se copia el árbol del commit elegido y se crea un commit raíz nuevo en el operativo. Al no haber ancestro común, no existe un merge posible entre las dos ramas principales y la correspondencia se reconstruye comparando árboles, no historiales.

Comandos y procedimientos exactos: `optimus-thy/docs/operacion/sincronizar-academico.md`.

El orden no es negociable: primero se corrige y se revisa en el académico, después se adopta el snapshot en el operativo. Un cambio que solo exista en producción es una diferencia pendiente de clasificar, no una base válida para el otro repositorio.

## Reglas

La regla general es simple: se modifica la edición que es dueña de la pieza, y lo demás se propaga. Las excepciones son las que aparecen en la tabla.

| Situación | Dónde se modifica |
| --- | --- |
| Error en una validación común | Académico (`backend/app/`), y se propaga por snapshot |
| Mejora del OCR compartido | Académico (`ocr/`) |
| Nuevo componente UI reutilizable | Académico (`frontend/src/design-system/`) |
| Pantalla exclusiva de tesis | Académico |
| Flujo pedido por los encargados del servicio | Operativo |
| Cambio de permisos institucionales | Operativo |
| Metodología o documentación académica | Académico |

- No se hace merge de `main` de un repositorio al `main` del otro.
- No se edita el árbol operativo desde el académico.
- Cada edición mantiene su propio `.env`, infraestructura, base de datos y almacenamiento.
- Sin credenciales ni datos clínicos reales fuera del operativo.
- Siempre se registra qué commit académico está usando el operativo.

Cuando una situación no encaja en la tabla, la respuesta por defecto es modificarla en el académico y propagarla; tocar producción sin pasar por esa vía exige un motivo escrito y una autorización explícita.

## Antes de sincronizar

Ninguna sincronización empieza sin esta comprobación cerrada. Si algún punto falla, no se copia nada y se resuelve primero la causa.

- [ ] `make sync-plan` no deja rutas `SIN_REGLA` y `make sync-verificar` termina en 0, sin rutas `COPIAR` pendientes.
- [ ] Si el working tree académico está sucio, la comparación se hace contra un ref explícito (un commit, no el árbol de trabajo).
- [ ] Cada diferencia está clasificada: registrada, candidata a ADR, candidata a backport o pendiente de decisión humana.
- [ ] Existe autorización explícita para cualquier copia desde el operativo hacia el académico.
- [ ] El PR correspondiente tiene CI en verde.
- [ ] La evidencia quedó registrada: hashes, diff, PR o ADR.

Una diferencia clasificada como backport se prepara como PR contra el académico; una clasificada como ADR se resuelve primero en `docs/adr/` y solo después se copia. Lo que queda «pendiente de decisión humana» no se sincroniza.

## Versionado

El operativo registra la base académica que adoptó en su lock y avanza a su propio ritmo; el académico no versiona al operativo. Por eso no existe una «versión común del núcleo»: la referencia compartida es el commit académico anotado en `docs/operacion/academico-snapshot.json` del repositorio operativo.

Esa referencia se actualiza solo cuando se adopta un snapshot nuevo y la comparación lo respalda. Mientras el lock no cambie, cualquier diferencia que aparezca entre las dos ediciones es trabajo propio de la edición operativa, no una deriva de base.
