# Design

## Context

El servicio ya decodifica la imagen en memoria antes de llamar a `analizar_imagen`; el contrato HTTP representa errores con `code` y `mensaje`. El backend ejecuta la inferencia como trabajo en cola y almacena el código de excepción en `error_detalle`, campo que entrega el endpoint de consulta del trabajo.

## Goals / Non-Goals

**Goals:**
- Reutilizar la imagen decodificada y los componentes existentes; el chequeo debe ejecutarse antes del pipeline y no introducir dependencias ni copias grandes.
- Conservar `imagen_no_parece_ecografia` a través del cliente y el trabajo hasta que la interfaz lo traduzca a una instrucción clara.

**Non-Goals:**
- Confirmar diagnóstico, anatomía o calidad clínica, ni sustituir la revisión profesional.
- Entrenar o invocar otro modelo, inspeccionar metadatos del archivo o aplicar correcciones automáticas a la imagen.

## Decisions

- Medir sobre los píxeles BGR ya cargados la proporción de píxeles casi acromáticos (diferencia entre el canal máximo y mínimo menor o igual a 24). Aceptar si la proporción es igual o superior a 0.90. Es un filtro deliberadamente simple y determinista que identifica la apariencia predominantemente en escala de grises común en ecografías; evita clasificar por extensiones o nombres, que no describen el contenido. No pretende autenticar una ecografía.
- Implementar el criterio en una función pequeña e independiente y comprobarlo en el endpoint justo después de decodificar, antes de `analizar_imagen`. Enviar HTTP 422 con el código contractual y un mensaje genérico. No modificar el contrato exitoso ni la versión de contrato: la salida no cambia.
- En el backend, distinguir ese código de otros errores HTTP del servicio mediante `ServicioRespondioError.codigo`; el worker ya persiste el código como `error_detalle`. En la interfaz, traducir únicamente ese código a un mensaje accionable; mantener el aviso genérico para los otros códigos y no exponer mensajes internos.
- Alternativa descartada: agregar un modelo de visión o dependencia de clasificación. Su coste, mantenimiento y riesgo de bloquear una inferencia válida exceden la función de filtro preliminar.

## Risks / Trade-offs

- [Una imagen ajena en escala de grises puede superar el criterio y una ecografía muy coloreada puede ser rechazada] → El mensaje y el criterio se describen como apariencia preliminar; las pruebas fijan el comportamiento del umbral y la decisión no se presenta como juicio clínico.
- [El umbral puede requerir calibración con imágenes de ecografía reales] → Mantenerlo como constante explícita y probar sus límites; ajustar posteriormente con un conjunto autorizado sin cambiar el contrato del endpoint.

## Migration Plan

No hay migración de datos ni dependencia nueva. Desplegar servicio IA, backend y frontend compatibles; si se revierte, revertir los tres componentes juntos para no perder el aviso específico. Los trabajos existentes no necesitan reprocesamiento.
