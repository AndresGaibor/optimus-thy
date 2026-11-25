# TES-330 — Métricas de acuerdo del modelo

## Why

El investigador necesita saber si el modelo acierta según el criterio del médico antes de presentar resultados de tesis, y hoy no hay forma de verlo en el sistema: las inferencias y las decisiones existen por separado. Sin un agregado por modelo, cualquier afirmación de rendimiento se haría a mano y sin trazabilidad.

## Contexto

El sistema registra inferencias y decisiones médicas, pero no conserva un veredicto de patólogo ni una clase clínica corregida. Por ello, el alcance verificable es el acuerdo con la decisión registrada; no se deben presentar sensibilidad, especificidad ni otras métricas clínicas.

## Cambio propuesto

Añadir `GET /investigacion/metricas`, restringido al permiso `investigacion.leer` y a la institución de quien consulta. El endpoint agrega, por modelo, las decisiones acepta/corrige/descarta y las inferencias pendientes; incluye filtros opcionales de fecha y modelo y desglose por resultado.

Añadir la pantalla `/investigador/metricas` con filtros, el acuerdo y la tabla de desglose por clase, estados accesibles de carga, vacío y error recuperable, y un enlace en la navegación del investigador.

## Alcance

- Calcular `acuerdo = acepta / total`, redondeado a cuatro decimales y nulo cuando no hay inferencias.
- Incluir las clases `benigno`, `maligno` y `sin_nodulo` con sus conteos de decisión y pendientes.
- Registrar la consulta agregada en la bitácora, sin almacenar contenido clínico.
- Especificar y probar agregación, filtros, aislamiento institucional, autorización y estados de la pantalla.

## Fuera de alcance

No se incorporan veredictos de patología, clases corregidas, migraciones de base de datos ni afirmaciones de rendimiento clínico.
