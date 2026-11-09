# E2E aislado

`run-isolated.sh` ejecuta el flujo de despliegue contra un daemon Docker-in-Docker efímero, no contra el Docker Compose del host. Requiere Docker funcional en el host, permiso para iniciar contenedores `--privileged`, acceso al repositorio principal en `/home/ubuntu/code/optimus-thy-operativo` y conectividad para descargar imágenes/dependencias.

Desde este directorio:

```sh
./run-isolated.sh
```

El contenedor `docker:dind` no publica puertos y no usa la red host. El repositorio fuente se monta en solo lectura como `/src`, estas pruebas como `/tests` y una carpeta temporal como `/e2e`. El script interior clona `dev` dentro de `/e2e/app`, crea configuración, certificados y claves de prueba aislados, ejecuta los casos negativos de guards y el recorrido positivo completo (check, dos deploys, status, health y rollback). Al salir, el contenedor DinD se elimina. El launcher compara antes y después los IDs de contenedores del proyecto exterior `optimus-thy` y la metadata de sus volúmenes `optimus-thy_pgdata`/`optimus-thy_miniodata`, y falla si algo cambió.

La limpieza no elimina volúmenes: ningún script del harness ejecuta `docker compose down -v`. Los recursos del proyecto de prueba permanecen dentro del daemon efímero y desaparecen cuando se elimina el contenedor DinD.

Este E2E **no se ejecuta en CI**: requiere Docker privilegiado (`--privileged`), y el job CI solo valida scripts/compose. Ejecutarlo manualmente en un host autorizado; usa imágenes y paquetes descargados durante el despliegue y requiere varios GiB libres para builds.
