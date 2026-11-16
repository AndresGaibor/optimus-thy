# Tasks

## 1. Imágenes del caso

- [x] 1.1 Rutas `POST` y `GET /casos/{caso_id}/imagenes` con validación por contenido y saneo.
- [x] 1.2 Saneo con Pillow: recodificación sin EXIF/ICC/texto y SHA-256 de la copia.
- [x] 1.3 Almacenamiento con clave opaca y enlace firmado; auditoría de carga y lectura.
- [x] 1.4 Pruebas de carga válida, archivo inválido, caso ajeno y listado.

## 2. Inferencia en cola

- [x] 2.1 Cliente del servicio de IA con validación del contrato 1.1 y artefactos.
- [x] 2.2 Manejador `inferencia` registrado en el worker.
- [x] 2.3 Persistencia transaccional de inferencia, nódulos, clasificación y artefactos.
- [x] 2.4 Lectura interna de objetos y subida por clave en el almacenamiento.
- [x] 2.5 Pruebas de flujo completo y de fallo del servicio.

## 3. Esquema y contrato

- [x] 3.1 Migración `0012` con clase, probabilidades, región y píxeles del nódulo.
- [x] 3.2 Contrato OpenAPI y tipos del frontend regenerados.
- [x] 3.3 Corrida real con los pesos del release: contrato 1.1 con artefactos.

## 4. Pantalla de modelos de IA

- [x] 4.1 Página de administración: listar, subir ZIP y activar versiones.
- [x] 4.2 Ruta y entrada de navegación.
- [x] 4.3 Historias de Storybook con estados y comprobaciones.
