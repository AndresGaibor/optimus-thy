## Por qué

TES-329 · HU-090 pide consultar los datasets anonimizados; el backend ya los crea y expone desde el change `datasets-anonimos` y no había pantalla.

## Qué cambia

- `/investigador/datasets`: lista de conjuntos con total de casos, k, huella y fecha, y detalle con las filas anonimizadas.
- Cliente `api/datasets.ts` sobre los tipos generados.
- Entrada «Datasets» en la navegación del investigador.

## Impacto

- Contrato de API: sin cambios.
- Esquema: sin cambios.
- Solo lectura: la creación de datasets queda fuera de esta pantalla.
