# Proposal

## Why

El servicio recibe imágenes válidas como archivos, pero que no necesariamente son ecografías tiroideas; procesarlas consume modelos y puede producir resultados sin sentido clínico. Se requiere una comprobación previa, barata y explicable, y comunicar su rechazo al médico sin revelar detalles internos.

## What Changes

- Evaluar características visuales básicas de la imagen decodificada antes de ejecutar los modelos y responder con el código `imagen_no_parece_ecografia` cuando no cumpla el criterio.
- Propagar el código por el cliente de IA y el trabajo en cola para mostrar al médico un aviso específico y permitir corregir la selección.
- Cubrir imágenes compatibles, no compatibles y el umbral del criterio con pruebas.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `inferencia`: rechazar antes de ejecutar los modelos una imagen que no parezca una ecografía tiroidea.
- `inferencia-interfaz`: mostrar un mensaje comprensible para el rechazo de una imagen no compatible.

## Impact

- Servicio de IA: validación de imagen decodificada y contrato de error HTTP.
- Backend: traducción del código del servicio y conservación como código de error del trabajo.
- Frontend médico: aviso específico ante el error del trabajo.
- Pruebas IA/backend y delta de OpenSpec; sin nuevas dependencias ni cambios de base de datos.
