# Sincronización académico ↔ producción

Este documento define cómo verificar y mover cambios entre `optimus-thy-academico` y `optimus-thy-operativo`. El snapshot de producción parte de un commit exacto del académico; después, producción puede endurecerse y documentarse por separado.

## Invariantes

- **Snapshot = copia exacta** del commit académico registrado en `docs/operacion/academico-snapshot.json`.
- **El working tree académico no se copia** si está sucio: se usa siempre `git archive` de un commit/ref.
- **Nunca se copian** `.env`, secretos, credenciales, `node_modules/`, artefactos locales ni bases de datos.
- **No force push** sin autorización explícita.
- **Ninguna copia operativo → académico** sin autorización explícita y revisión humana.
- Toda sincronización debe dejar evidencia verificable (commit/tree hash, diff, PR o ADR).


## Main protegida y rama dev

- `main` exige PR, check `CI OK`, rama al día y no permite force push ni borrado; la protección incluye a administradores.
- El trabajo diario se hace en `dev`; los cambios llegan a `main` por PR desde `dev` o desde una rama de historia.
- Un snapshot raíz (historia no relacionada) no puede entrar por un PR normal: requiere autorización explícita y un ajuste temporal de la protección. No es un force push rutinario.

## Verificación rápida

Desde el repo de producción:

```bash
make comparar-academico
# o con rutas/ref explícitos:
bash scripts/comparar-academico.sh /ruta/al/optimus-thy-academico HEAD
```

Interpretación:

- `académico.working-tree=SUCIo`: hay cambios locales en el académico; la comparación usa el commit/ref, no esos archivos.
- `snapshot-base=OK`: `commit_snapshot_produccion` tiene el mismo tree que `tree_academico` del lock.
- `snapshot-base=DIFIERE`: el lock no describe la base real; revisar antes de cualquier backport.
- `IDENTICOS`: el árbol del commit académico coincide con `HEAD` del operativo.
- `DIFERENCIAS: N`: hay N líneas/rutas reportadas por `diff -rq`; un directorio nuevo puede contar como una sola línea (no es el número exacto de archivos). Revisar el resumen por prefijo y decidir si se registran, se adaptan o se backportan con autorización.

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

Tareas:
1. Ejecuta `make comparar-academico` en el repo de producción.
2. Reporta snapshot-base, commit/tree comparados, estado del working tree académico y diferencias.
3. Clasifica diferencias como: ya registradas, candidatas a ADR, candidatas a backport o pendientes de decisión humana.
4. Si hay autorización, prepara el diff acotado por paths y el plan de PR/worktree; no hagas push ni merge.

Criterio de aceptación:
- Existe evidencia verificable (hashes, diff o lista de rutas).
- No se modificó ningún repo sin autorización.
- No se expusieron secretos.
- Toda acción propuesta incluye comando exacto y riesgo.
```
