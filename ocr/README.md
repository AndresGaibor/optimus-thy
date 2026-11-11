# ocr

Servicio de OCR local de OPTIMUS-THY (HT-040): recibe una ficha en PDF, JPG o PNG
y devuelve texto, bloques y confianza. Contrato versionado 1.1, dos motores:

- `glm` (por defecto): GLM-OCR con el paquete `glmocr` contra un servidor de
  inferencia propio.
- `tesseract`: Tesseract en español, la alternativa ligera.

Nada sale del equipo salvo que `OCR_PERMITIR_API_EXTERNA` esté encendida.

```bash
pip install -e ".[tesseract,dev]"     # o -r requirements-glm.txt para GLM-OCR
uvicorn app.main:app --host 127.0.0.1 --port 8001
pytest -q
```

Instalación del motor real, montaje de pesos, variables de entorno y contrato
completo: `docs/arquitectura/servicio-ocr.md`. Con Docker Compose se levanta con
`make up` desde la raíz del repo.
