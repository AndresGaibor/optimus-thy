FROM python:3.12-slim

# El stack de inferencia (torch, tensorflow, ultralytics, timm) pesa ~2 GB:
# solo entra en la imagen cuando se pide, para que el build por defecto y el CI
# sigan siendo ligeros. Los pesos nunca se copian aquí: se montan en /modelos.
ARG INSTALAR_MODELOS=false

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY pyproject.toml ./
COPY app ./app
COPY requirements-modelos.txt ./

RUN pip install --upgrade pip \
 && pip install . \
 && if [ "$INSTALAR_MODELOS" = "true" ]; then pip install -r requirements-modelos.txt; fi

# Usuario no root.
RUN useradd --create-home --uid 1000 app
USER app

EXPOSE 8002

HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD python -c "import urllib.request, sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8002/health', timeout=2).status == 200 else 1)"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002"]
