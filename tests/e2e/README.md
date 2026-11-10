# E2E aislado

`run-isolated.sh` ejecuta el flujo de despliegue contra un daemon Docker-in-Docker efímero, no contra el Docker Compose del host. Se ejecuta en CI en el job `E2E despliegue (DinD)` y también puede ejecutarse manualmente en un host autorizado con Docker funcional, permiso para iniciar contenedores `--privileged` y conectividad para descargar imágenes y dependencias.

Desde este directorio:

```sh
./run-isolated.sh
```

El repositorio fuente se deriva de la ubicación del script; se puede indicar otro checkout con `E2E_REPO=/ruta/al/repositorio`. Se admite un checkout normal o un worktree (`.git` como directorio o archivo). Si el checkout es un worktree, el launcher monta en solo lectura el gitdir común en su misma ruta absoluta para que Git lo resuelva dentro del contenedor. El launcher obtiene `E2E_HEAD_SHA` desde `HEAD` y `E2E_BASE_SHA` desde `origin/main` y los pasa al contenedor. En CI el checkout incluye el historial completo. El script interior crea un origen bare sintético con las ramas `dev` y `main` apuntando a esos SHA, clona `dev` en `/e2e/app` y valida que el checkout descienda de `main`.

El contenedor `docker:dind` no publica puertos ni usa la red host. El repositorio fuente se monta en solo lectura como `/src`, estas pruebas como `/tests` y una carpeta temporal como `/e2e`. El script crea configuración, certificados y claves de prueba aislados, ejecuta los casos negativos de guards y el recorrido positivo completo (check, dos deploys, status, health y rollback). Al salir, el contenedor DinD se elimina. El launcher compara antes y después los IDs de contenedores del proyecto exterior `optimus-thy` y la metadata de sus volúmenes `optimus-thy_pgdata`/`optimus-thy_miniodata`, y falla si algo cambió.

La limpieza no elimina volúmenes: ningún script del harness ejecuta `docker compose down -v`. Los recursos del proyecto de prueba permanecen dentro del daemon efímero y desaparecen cuando se elimina el contenedor DinD.

Aunque el flujo está aislado, el launcher requiere acceso a Docker y crea un contenedor privilegiado; no lo ejecutes en un host no autorizado. La ejecución manual necesita `origin/main` disponible en el checkout fuente y al menos 6 GiB libres en el filesystem temporal seleccionado (`E2E_TMPDIR`, `TMPDIR` o `/tmp`); en CI, `/tmp` suele bastar. Si no hay espacio suficiente, prueba `TMPDIR=/var/tmp` o `E2E_TMPDIR=<fs con espacio>`. Las imágenes y paquetes se descargan durante el despliegue y se requieren varios GiB libres para los builds.
