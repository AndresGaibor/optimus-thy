# Sincronización académico ↔ producción

Este documento define cómo verificar y mover cambios entre `optimus-thy-academico` y `optimus-thy-operativo`. El snapshot de producción parte de un commit exacto del académico; después, producción puede endurecerse y documentarse por separado.

## Invariantes

- **Snapshot = copia exacta** del commit académico registrado en `docs/operacion/academico-snapshot.json`.
- **El working tree académico no se copia** si está sucio: se usa siempre `git archive` de un commit/ref.
- **Nunca se copian** `.env`, secretos, credenciales, `node_modules/`, artefactos locales ni bases de datos.
- **No force push** sin autorización explícita.
- **Ninguna copia operativo → académico** sin autorización explícita y revisión humana.
- Toda sincronización debe dejar evidencia verificable (commit/tree hash, diff, PR o ADR).
- **La clasificación de rutas está versionada** en `scripts/sincronizacion.json`: la herramienta no decide por su cuenta qué se comparte.


## Main protegida y rama dev

- `main` exige PR, check `CI OK`, rama al día y no permite force push ni borrado; la protección incluye a administradores.
- El trabajo diario se hace en `dev`; los cambios llegan a `main` por PR desde `dev` o desde una rama de historia.
- Un snapshot raíz (historia no relacionada) no puede entrar por un PR normal: requiere autorización explícita y un ajuste temporal de la protección. No es un force push rutinario.

## Cómo se sincroniza

La política clasifica, la herramienta copia solo lo que la política llama `COPIAR` y el verificador es el que autoriza el commit. Cada paso deja salida verificable:

```bash
# 1) Plan: hashes, conteos y rutas por grupo. No escribe nada.
make sync-plan

# 2) Revisar a mano las rutas ADAPTAR y resolver cualquier SIN_REGLA.

# 3) Aplicar solo lo marcado COPIAR; primero en seco.
make sync-aplicar ARGS="--seco"
make sync-aplicar

# 4) Gates del repo y verificación de la sincronización.
make check
make sync-verificar ARGS="--registrar"

# 5) Commit y PR citando el commit académico.
git add -A
omp commit -c "sincroniza académico <commit académico>"
```

1. **Plan.** `make sync-plan` imprime el commit y el tree del ref académico, el commit del operativo, el estado de su working tree, la versión de las reglas, los conteos de los cuatro grupos y hasta `--limite` rutas de cada uno. Es de solo lectura: no toca ninguno de los dos repositorios.
2. **Clasificación manual de `ADAPTAR`.** La herramienta nunca copia una ruta marcada `ADAPTAR`: son piezas que se comparten en concepto pero divergen en la edición operativa, y cada regla lleva su `motivo` (y opcionalmente una `nota`). Se revisa el diff de esas rutas y se editan a mano en el operativo. Si `plan` deja rutas `SIN_REGLA`, la política está incompleta: se añade la regla a `scripts/sincronizacion.json` en un PR y no se copia nada hasta entonces.
3. **Aplicar.** `make sync-aplicar ARGS="--seco"` lista lo que se copiaría sin escribir; `make sync-aplicar` copia únicamente las rutas `COPIAR`, tomadas de `git archive` del ref académico, y nunca escribe `ADAPTAR` ni `INDEPENDIENTE`. No hace `git add` ni commit: el árbol queda listo para revisar con `git diff`.
4. **Gates y verificación.** `make check` valida el árbol como cualquier otro cambio —formato, tipos, pruebas, build y catálogo— y `make sync-verificar` comprueba que no queden rutas `COPIAR` pendientes ni `SIN_REGLA`, que `contracts/openapi.json` exista en ambos lados y que `frontend/src/api/schema.d.ts` siga presente. Con `ARGS="--registrar"` deja el registro de la sincronización en `docs/operacion/academico-sync-ultimo.json`.
5. **Commit y PR.** El commit se crea con `omp commit`, no con `git commit` directo, porque el mensaje y el changelog los genera el pipeline del repositorio. Incluye el código copiado, los ajustes manuales de `ADAPTAR`, el registro del verificador y, si cambió la base, `docs/operacion/academico-snapshot.json`. El mensaje y el cuerpo del PR citan el commit académico de origen y el par commit-tree comparado, para que la evidencia no dependa de la memoria de quien sincronizó.

Un `make comparar-academico` suelto sigue funcionando, pero es solo un alias de `make sync-plan`: el flujo completo es el de arriba.

## Verificación rápida

Desde el repo de producción:

```bash
make sync-plan                    # clasificación, sin escribir nada
make sync-aplicar ARGS="--seco"   # lista lo que copiaría, sin escribir
make sync-verificar               # gates de la sincronización
```

Los mismos comandos sin `make`, o con rutas y ref explícitos:

```bash
python3 scripts/sincronizar.py plan      --academico /ruta/al/optimus-thy-academico --ref HEAD
python3 scripts/sincronizar.py aplicar   --academico /ruta/al/optimus-thy-academico --ref HEAD --seco
python3 scripts/sincronizar.py verificar --academico /ruta/al/optimus-thy-academico --ref HEAD --registrar
```

`--academico` toma por defecto la variable `ACADEMICO_DIR` o `/home/ubuntu/code/optimus-thy-academico`; `--ref` toma por defecto `HEAD`. `plan` acepta además `--json` (objeto equivalente a la salida de texto) y `--limite N` (rutas impresas por grupo, por defecto 20).

Qué imprime `plan`:

- `academico.commit=` y `academico.tree=`: commit y tree del ref académico, leídos con `git archive`.
- `operativo.commit=` y `operativo.ref=`: commit y ref del operativo desde el que se compara.
- `operativo.working-tree=limpio|sucio`: si hay cambios sin commitear en el operativo.
- `reglas.version=`: versión de `scripts/sincronizacion.json` con la que se clasificó.
- `COPIAR <n>`, `ADAPTAR <n>`, `INDEPENDIENTE <n>`, `SIN_REGLA <n>`: conteos por grupo.
- Una línea `<GRUPO> <ruta>` por ruta, cortada por `--limite`.

Qué significa cada grupo:

- `COPIAR`: pieza compartida cuya copia desde el académico es la política vigente. `aplicar` la escribe sin intervención.
- `ADAPTAR`: pieza compartida en concepto que en el operativo tiene cambios propios. Se lee el diff y se adapta a mano; la herramienta no la toca.
- `INDEPENDIENTE`: pieza de una sola edición (despliegue, manuales operativos, `.env`, ADR, pantallas propias). No se copia nunca, en ningún sentido.
- `SIN_REGLA`: ninguna regla coincide con la ruta. No debería aparecer: significa que la política no cubre el árbol y que hay que añadir la regla a `scripts/sincronizacion.json` antes de seguir. Con una sola ruta `SIN_REGLA` la sincronización falla en vez de adivinar.

La política completa, con la tabla de qué se comparte y qué no, vive en `docs/arquitectura/repositorios.md`; `scripts/sincronizacion.json` es esa política expresada como reglas ejecutables.

Códigos de salida:

| Código | Significado |
| --- | --- |
| `0` | Correcto. |
| `2` | Error de entorno o de uso: repo académico ausente, ref inexistente o argumento inválido. |
| `3` | Hay rutas `SIN_REGLA`. `aplicar` no copia nada y `verificar` falla. |
| `4` | `verificar` encontró rutas `COPIAR` pendientes: la sincronización no terminó. |

Qué imprime `aplicar`: `APLICADAS n`, `YA_IGUALES n` y `OMITIDAS n` (rutas escritas, rutas que ya eran idénticas y rutas que no se tocaron por las exclusiones fijas o por no ser copiables), seguidas de un `git diff --stat` resumido. Aunque una regla marque la ruta como `COPIAR`, la herramienta excluye siempre `.env*`, `node_modules/**`, `var/**`, `**/__pycache__/**`, pesos de modelo (`*.pt`, `*.pth`, `*.keras`, `*.h5`, `*.onnx`, `*.ckpt`), `catalogo-static/**` y `test-results/**`.

Qué comprueba `verificar`:

- Que `COPIAR` sea 0 y `SIN_REGLA` sea 0.
- Que `contracts/openapi.json` exista en ambos lados y que `frontend/src/api/schema.d.ts` exista en el operativo.
- Avisos que **no** hacen fallar: desfase entre `backend/uv.lock` y `backend/pyproject.toml` (dependencias declaradas que no aparecen en el lock) y desfase entre `docs/operacion/academico-snapshot.json` y el commit académico con el que se comparó.
- Con `--registrar` escribe `docs/operacion/academico-sync-ultimo.json` con `commit_academico`, `tree_academico`, `commit_operativo`, `fecha` (ISO-8601 UTC), `grupos` (`copiar`, `adaptar`, `independiente`, `sin_regla`) y `version_reglas`. El archivo nace la primera vez que se ejecuta con `--registrar` y se commitea con la sincronización.

La fuente de la clasificación es `scripts/sincronizacion.json`: `{"version": 1, "compartido": [...], "adaptar": [...], "independiente": [...]}`, con entradas `{"patron": "...", "motivo": "..."}` y una `nota` opcional en `adaptar`. El patrón es un glob sobre la ruta relativa, donde `**` cubre cualquier profundidad, y **gana la primera regla que coincide**, en el orden compartido → adaptar → independiente. Cambiar qué se comparte es editar ese archivo y su `version`, no improvisar en el momento de copiar.

## Procedimiento snapshot (solo con autorización)

Objetivo: reemplazar la base de producción por un commit académico exacto, preservando evidencia y `.env` locales.

```bash
# 1) En el repo académico: confirmar commit limpio a usar
cd /ruta/al/optimus-thy-academico
git status
ACADEMICO_COMMIT=$(git rev-parse HEAD)
ACADEMICO_TREE=$(git rev-parse HEAD^{tree})

# 2) Exportar el commit (no el working tree)
TMP=$(mktemp -d)
mkdir -p "$TMP/snapshot"
git archive --format=tar "$ACADEMICO_COMMIT" | tar -xf - -C "$TMP/snapshot"

# 3) Crear commit raíz verificable en un clon temporal de producción
cd /ruta/al/optimus-thy-operativo
git bundle create "$TMP/operativo.bundle" --all   # respaldo de seguridad
CLON=$(mktemp -d)
git init "$CLON"
tar -C "$TMP/snapshot" -cf - . | tar -C "$CLON" -xf -
git -C "$CLON" add -A
git -C "$CLON" branch -M snapshot
omp commit --legacy --no-changelog -m commandcode/deepseek/deepseek-v4.1-flash -c "Snapshot académico $ACADEMICO_COMMIT"
test "$(git -C "$CLON" rev-parse HEAD^{tree})" = "$ACADEMICO_TREE"

# 4) Conservar archivos locales que no deben perderse
cp -n .env "$TMP/.env.backup" 2>/dev/null || true

# 5) Sustituir la rama con autorización explícita (no ejecutar sin aprobación)
# main está protegida: NO hacer push directo ni force push.
# Un snapshot raíz requiere autorización y ajuste temporal de la protección;
# los cambios normales se preparan en dev y entran por PR con CI OK.
```

Después del snapshot se actualiza el lock `docs/operacion/academico-snapshot.json` con el commit y el tree adoptados, y `make sync-verificar` confirma que el árbol quedó coherente antes de commitear.

## Procedimiento backport (solo con autorización)

Objetivo: llevar cambios seleccionados de producción al académico sin copiar secretos ni arrastrar endurecimiento no aprobado.

```bash
cd /ruta/al/optimus-thy-academico
git fetch origin
git worktree add -b produccion/<nombre> ../optimus-thy-academico-backport origin/main
cd ../optimus-thy-academico-backport

# Diff acotado desde la base del snapshot
git -C /ruta/al/optimus-thy-operativo diff <snapshot> <head> -- <paths>

# Aplicar solo lo autorizado
git -C /ruta/al/optimus-thy-operativo diff <snapshot> <head> -- <paths> | git apply --check
git -C /ruta/al/optimus-thy-operativo diff <snapshot> <head> -- <paths> | git apply

# Si cambió el contrato/API:
# regenerar contracts/openapi.json y frontend/src/api/schema.d.ts según el flujo del repo.

# Validar en el repo académico según sus gates; commitear con el flujo acordado.
# git push origin HEAD:<rama-backport>
# Abrir PR. Nunca merge automático.
```

Las rutas del backport salen de la clasificación, no del recuerdo: `make sync-plan` indica qué es `INDEPENDIENTE` (nunca vuelve al académico) y qué quedó en `ADAPTAR`, que es lo único candidato a PR acotado.

## Registro de decisiones

- Registrar decisiones relevantes en `docs/adr/README.md` y archivos ADR correspondientes.
- Estado esperado: adoptada, adaptada o reemplazada, con evidencia (commit, PR, issue o diff).
- Si producción resuelve algo que el académico aún no tiene, documentar la decisión antes de proponer copia operativo → académico.
- Regla operativa: **preguntar antes de copiar operativo → académico**.

## Prompt para un agente

```text
Objetivo: sincronizar cambios entre optimus-thy-academico y optimus-thy-operativo sin perder evidencia ni copiar secretos.

Reglas:
- Trabaja en modo solo lectura hasta recibir autorización explícita para modificar repos.
- No copies .env, secretos, credenciales, node_modules ni artefactos locales.
- No uses force push ni merge automático.
- El snapshot académico se toma con git archive de un commit/ref, nunca del working tree sucio.
- Ninguna copia operativo → académico se hace sin autorización explícita.
- `main` solo recibe PR con `CI OK`; trabajar en `dev`.
- No force push ni borrado de `main`.
- No edites scripts/sincronizacion.json para hacer pasar una ruta sin revisión humana.

Tareas:
1. Ejecuta `make sync-plan` en el repo de producción.
2. Reporta los hashes (academico.commit/tree, operativo.commit), el estado del working tree, la versión de las reglas y los conteos COPIAR/ADAPTAR/INDEPENDIENTE/SIN_REGLA.
3. Si hay rutas ADAPTAR o SIN_REGLA, propón la revisión o la regla que falta antes de copiar nada.
4. Si hay autorización, ejecuta `make sync-aplicar ARGS="--seco"`, presenta el diff y el plan de PR/worktree; no hagas push ni merge.
5. Cierra con `make sync-verificar` (y `ARGS="--registrar"` si la sincronización se commitea) y adjunta su salida y sus códigos de salida.

Criterio de aceptación:
- Existe evidencia verificable (hashes, diff o lista de rutas).
- No se modificó ningún repo sin autorización.
- No se expusieron secretos.
- Toda acción propuesta incluye comando exacto y riesgo.
```
