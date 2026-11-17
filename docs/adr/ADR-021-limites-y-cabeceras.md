# ADR-021 — Límite de peticiones y cabeceras de seguridad

**Estado:** Aceptada.  
**Fecha:** 2026-11-11.

## Contexto

RS-APP-10 exige límite de peticiones y de tamaño, en especial en la inferencia,
que es la operación costosa (CA-06). RS-APP-02 y RS-APP-05 exigen defensas
frente a inyección, XSS, CSRF, SSRF y recorrido de rutas, con validación de toda
entrada en el servidor. El backend corre como un proceso uvicorn detrás del
proxy inverso y la cola de trabajos ya es en proceso, sin broker externo
(ADR-006): no hay Redis en la infraestructura y no se quiere añadir un servicio
nuevo solo para contar peticiones.

## Decisión

1. **Límite en memoria por proceso.** `backend/app/security/limites.py`
   implementa una ventana deslizante de 60 s por clave. El estado vive en
   `app.state`, nunca en un global de módulo, para que cada instancia de la app
   (y cada app de prueba) tenga su propia cuenta. El reloj es inyectable y las
   claves se acotan a 10 000, descartando la más antigua.
2. **Dos cupos configurables.** `RATE_LIMIT_POR_MINUTO` (defecto 120) limita el
   total por sesión, o por host del cliente si no hay cookie; la clave de sesión
   es el SHA-256 del token, nunca el token. `INFERENCIA_POR_MINUTO` (defecto 10)
   limita solo `POST /trabajos` con `tipo == "inferencia"`, por usuario. El valor
   `0` desactiva cada límite.
3. **Respuesta 429 uniforme.** El cuerpo usa el sobre de error existente
   (`{"error": {"code": "rate_limited", ...}, "request_id": ...}`) y la cabecera
   `Retry-After` indica los segundos que faltan para liberar cupo.
4. **Rutas excluidas del límite y de la CSP estricta.** `/health` (sonda del
   contenedor), `/docs`, `/openapi.json` y `/redoc` (documentación interactiva)
   no consumen cupo ni reciben la política estricta, para no romper Swagger.
5. **Cabeceras de seguridad en toda respuesta de la API.**
   `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
   `Referrer-Policy: no-referrer` y
   `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`.
   La API nunca devuelve HTML: el texto del usuario viaja como JSON y el
   navegador no lo interpreta gracias a `nosniff` y a la CSP.
6. **Tope de tamaño en la frontera.** Ya existe `DOCUMENTO_MAX_BYTES` (20 MB)
   con respuesta 413 en la carga de documentos, `MAX_ARCHIVO_BYTES` (15 MB) en
   imágenes, `MAX_OBJECT_BYTES` (20 MB) al leer objetos y
   `MAX_BYTES_ARTEFACTOS` (8 MB) en el contrato de inferencia. No se inventa un
   límite nuevo: el coste de la inferencia se acota con el cupo por usuario y su
   entrada solo puede llegar por esas cargas ya limitadas.
7. **SSRF sin URLs del usuario.** Ningún payload acepta una URL: `ClienteIA` y
   el cliente de OCR construyen sus destinos desde `Settings` (`IA_URL`,
   `OCR_URL`). Un `url` colada en el payload se guarda pero el manejador la
   ignora; una prueba con transporte de captura comprueba que el cliente solo
   habla con la URL configurada.

## Alternativas consideradas

- **Redis o `slowapi`.** Descartada: añade un servicio o dependencia para
  contar peticiones de un único proceso; ADR-006 ya evita el broker externo.
- **Límite solo en el proxy inverso.** Necesario como primera línea, pero no
  conoce el usuario autenticado ni distingue la inferencia del resto.
- **Token bucket.** Equivalente en coste; la ventana deslizante da un
  `Retry-After` predecible y fácil de explicar en pruebas.
- **CSP con directivas para el frontend.** No aplica: el frontend se sirve como
  archivos estáticos y esta CSP protege las respuestas de la API, no una página.

## Consecuencias y límites

- El límite es **por proceso**: con varios workers el cupo efectivo se
  multiplica y cada reinicio lo reinicia. No sustituye al límite del proxy ni
  protege frente a un DDoS volumétrico.
- El estado es acotado (10 000 claves); una clave sin actividad se purga como
  mucho una vez por ventana.
- Un origen ajeno sigue respondiendo 403 (ADR-015) y consume cupo antes de ser
  rechazado, porque el filtro de `Origin` es el middleware más interno.
- La documentación interactiva queda fuera de la CSP estricta a propósito; el
  resto de rutas la recibe siempre.

## Verificación

`backend/tests/test_seguridad_ataques.py` cubre inyección SQL en login y en
parámetros tipados, XSS guardado y devuelto como JSON, CSRF por `Origin` y sin
sesión, recorrido de rutas en la carga y la descarga, SSRF con transporte de
captura, el 429 con `Retry-After` de ambos cupos, la ventana con reloj inyectado
y el 413 por tamaño. El detalle por requisito está en
`docs/pruebas/matriz-de-pruebas.md` (RS-APP-02, RS-APP-05, RS-APP-10).
