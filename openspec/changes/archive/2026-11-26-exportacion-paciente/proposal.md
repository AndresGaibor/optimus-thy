# Exportación de datos del paciente

Permitir que una persona autorizada descargue los datos de un paciente y sus resultados de inferencia en JSON o CSV, con alcance institucional y registro de auditoría.

## Por qué

Atender solicitudes de acceso a los datos personales y clínicos asociados, con un formato reutilizable y sin exponer rutas ni identificadores técnicos de almacenamiento.

## Alcance

Añadir una ruta de exportación con control `paciente.leer`, aislamiento por institución, descarga adjunta JSON/CSV y registro `EXPORT.EXPORT`. Este permiso es el apropiado porque la exportación no amplía el acceso clínico: el médico ya puede leer la ficha y las inferencias. La identidad se exporta en claro para portabilidad, sin datos de almacenamiento.
