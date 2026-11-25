## 1. Interfaz

- [x] 1.1 `useSubidaEcografia` mantiene una lista de archivos con estado y error propios.
- [x] 1.2 `DialogoSubida` acepta varios archivos y muestra el estado de cada uno.
- [x] 1.3 Progreso del lote con contador de listos y barra de avance.
- [x] 1.4 Un archivo rechazado o fallido no descarta los demás; se ofrece reintento.
- [x] 1.5 `CasoPage` reutiliza el diálogo compartido en lugar de su diálogo de un solo archivo.
- [x] 1.6 El detalle de la inferencia indica la imagen usada (formato, dimensiones y fecha).

## 2. API

- [x] 2.1 `GET /casos/{id}/imagenes` ordena de la más reciente a la más antigua.
- [x] 2.2 Sin límite de imágenes por caso: solo se valida formato, tamaño y dimensiones por archivo.

## 3. Pruebas

- [x] 3.1 Tres imágenes listadas en orden.
- [x] 3.2 Subida de dos archivos con refresco de la galería.
- [x] 3.3 Archivo rechazado sin perder la galería ni las demás subidas.
- [x] 3.4 Error de subida por archivo con reintento.
- [x] 3.5 Prueba de backend para el orden del listado.
