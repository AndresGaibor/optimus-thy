## Por qué

TES-331 · HU-092 pide comparar resultados; la misma imagen puede tener inferencias de versiones distintas de modelo y hoy el dato no se cruza en ninguna pantalla.

## Qué cambia

- Pantalla `/medico/comparacion` que agrupa las inferencias por imagen y muestra, por modelo y versión, resultado, confianza y probabilidades.
- Veredicto textual por imagen: coinciden, difieren o sin comparación; filtro por discrepancias y resumen de conteos.
- Aviso permanente de que no es una recomendación clínica.

## Impacto

- Contrato de API: sin cambios; se usan `GET /resultados` y su ventana de 50 inferencias.
- Esquema: sin cambios.
- Límite conocido: `InferenciaOut` no asocia inferencias a conjuntos de datos, así que la comparación es modelo contra modelo por imagen, no entre datasets.
