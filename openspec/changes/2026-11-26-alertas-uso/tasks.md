# Tasks

- [x] Implementar el detector puro de fallos, descargas masivas y exportaciones fuera de horario en `backend/app/security/alertas.py`.
- [x] Exponer `GET /seguridad/alertas` con permiso, aislamiento institucional, ventana de 24 horas y registro `AUDIT_READ` en `backend/app/api/alertas.py`.
- [x] Registrar el router en `backend/app/main.py` y cubrir umbrales, horarios, aislamiento, autorización y privacidad en `backend/tests/test_alertas.py`.
- [x] Documentar la decisión en `docs/adr/ADR-022-alertas-patrones-uso.md`.
- [x] Validar los artefactos con `openspec validate 2026-11-26-alertas-uso --strict`.
- [ ] Ejecutar los checks focalizados del backend y `pytest tests/test_alertas.py`.
