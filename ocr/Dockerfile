FROM python:3.12-slim

# El SDK de GLM-OCR arrastra torch y transformers (~2 GB): solo se instala
# cuando se pide. Los pesos no entran en la imagen, se montan en /modelos.
ARG INSTALAR_GLM=false

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Tesseract es el motor de la imagen: aquí GLM-OCR no cabría sin GPU ni pesos.
RUN apt-get update \
 && apt-get install -y --no-install-recommends tesseract-ocr tesseract-ocr-spa \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY pyproject.toml ./
COPY app ./app
RUN pip install --upgrade pip \
 && pip install ".[tesseract]" \
 && if [ "$INSTALAR_GLM" = "true" ]; then pip install ".[glm]"; fi

ENV OCR_MOTOR=tesseract

# Usuario no root.
RUN useradd --create-home --uid 1000 app
USER app

EXPOSE 8001

HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD python -c "import urllib.request, sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8001/health', timeout=2).status == 200 else 1)"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
