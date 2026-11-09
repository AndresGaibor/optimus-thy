# Mockup anterior de OPTIMUS-THY

## Origen

Copia del build de Bun, sin validación, publicado por el Worker `optimus-thy`, versión histórica `6afee382-…` (subida el 2026-04-28). Preview original: <https://6afee382-optimus-thy.andresalexander14.workers.dev/>.

Es un mockup visual: no tiene backend y utiliza datos simulados. No representa un sistema funcional ni valida operaciones.

## Contenido y hashes SHA-256

Los archivos del build raíz (`index.html`, `chunk-4xbb4ced.js`, `chunk-2ecgj4k4.css` y `logo-kygw735p.svg`) se copiaron byte a byte desde `dist/`; no se reformatearon ni minificaron.

| Archivo | SHA-256 |
| --- | --- |
| `index.html` | `ecb1358fbe617f632e0d60ad4cf615183043729a193e9d2489ec98d0f0bd95df` |
| `chunk-4xbb4ced.js` | `92a62eec04267fd09cef98dcbc6f8c087c2c7e25fbfc26a7f89918a4359bd17d` |
| `chunk-2ecgj4k4.css` | `a526631c57d50821c5723a67a869313f87eaa3ce3cd58ce494c53bec34946c67` |
| `logo-kygw735p.svg` | `6395a2d7c1700c4397d0f0bf0ad466b6d01787dc22ad0a17cb0e1d45c31463a8` |

Los estilos están en `chunk-2ecgj4k4.css`. El JavaScript de la aplicación está en `chunk-4xbb4ced.js` y el logo en `logo-kygw735p.svg`.

## Imágenes

Son 10 PNG bajo `images/`, referenciados por `chunk-4xbb4ced.js` con rutas absolutas `/images/*.png`. Se sirven en `/images/<archivo>.png`. Los archivos se copiaron byte a byte, sin recomprimir ni redimensionar. Total: 22,909,905 bytes (~21.85 MiB).

| Archivo | Bytes | SHA-256 |
| --- | ---: | --- |
| `eco-doppler-color.png` | 1,709,430 | `3d1118085464bdbe992e970723aafd2cf877fc3aab85e1e33297b3782940874d` |
| `eco-nodulo-hipoecoico.png` | 1,696,446 | `ae1be54c410b43b0a960b703779c63c8b71f551d1964519a7ea7e2707a341ca5` |
| `eco-nodulo-quistico.png` | 1,612,148 | `38826100db460040aace3d2525767d8b7b2bd9003053c1cef0638a2b1569e3d0` |
| `ficha-consulta-general.png` | 3,413,654 | `c63fb9d5c31d86377188a063b381f37bd382019c6441cd0f548eee2ca6688a10` |
| `ficha-ecografia.png` | 3,540,868 | `69829cc3c909dc6efabbb45901a5207f9a0956e558ef7417bc0feb191d495087` |
| `ficha-laboratorio.png` | 2,920,534 | `3cb038e874cd35b56992ac206677b64cba0931f925aad5dd86229d3cbba8381b` |
| `ficha-paaf-biopsia.png` | 2,609,679 | `a1328dd0bde66f0223a44617b65268f35fa14769ed3bbba3186cf3a7ceafd6ce` |
| `histopatologia-he.png` | 2,492,028 | `719b2939c62e2c5406b59faf0cc9bcb682b4bb27e8d8c0b83d140a3d38ea2a97` |
| `paaf-citologia.png` | 2,296,363 | `38e76f3a5f87bfacc32c7d05a89ddaed06bc15faf0bcac3149ab8c99c945f42d` |
| `tc-cuello-axial.png` | 797,755 | `75a2b0a3f8577c17a52b90a1b0773bd7e25c3a3b43ddfbb2fa254bb7bb70198e` |

## Rutas

La lista completa de las 24 rutas también está en [`rutas.txt`](./rutas.txt):

```
/
/admin/audit
/admin/dashboard
/admin/projects
/admin/roles
/admin/settings
/admin/users
/doctor/dashboard
/doctor/images
/doctor/inference
/doctor/patients
/doctor/patients/:id
/doctor/records
/doctor/results
/login
/projects
/projects/:id
/researcher/audit
/researcher/cohorts
/researcher/dashboard
/researcher/datasets
/researcher/error-analysis
/researcher/metrics
/role-select
```

## Cómo servirlo

Es una SPA: las rutas profundas son rutas del cliente, no archivos existentes. El servidor debe responder `index.html` como fallback para esas rutas y servir los recursos estáticos desde esta carpeta. Para probar localmente con Bun, desde esta carpeta ejecuta:

```sh
bunx serve -s .
```

Luego abre la URL local que indique el servidor. La opción `-s` habilita el fallback de SPA.

## Uso en el catálogo

1. `frontend/.storybook/main.ts` monta esta carpeta como `staticDirs` en `images/`.
2. Las historias toman las rutas de `frontend/src/screens/fixtures/media.ts` (`./images/<archivo>.png`), que en el catálogo resuelven a `/storybook/images/…`.
3. El nginx del edge mapea `/storybook/images/…` al servidor de Storybook (regla con `images` en el grupo de prefijos).
4. Las pantallas de la app no usan estas imágenes: los fixtures siguen siendo sintéticos y `src` solo se define en las historias.
