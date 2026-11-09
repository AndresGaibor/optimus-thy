# OPTIMUS-THY — Sistema de Gestión Clínica e Inferencia IA para Cáncer de Tiroides

Este repositorio contiene la arquitectura completa y de referencia funcional del proyecto **OPTIMUS-THY**.

## 🏗️ Estructura del Repositorio

* `backend/`: API FastAPI (Python, SQLAlchemy, PostgreSQL, RQ/Redis, Pydantic v2).
* `frontend/`: Aplicación React + TypeScript impulsada por Bun y Tailwind CSS.
* `ia-tiroides/`: Módulo de inferencia con modelos de visión (DINOv3 / YOLO) para clasificación de nódulos tiroideos.
* `ia-ocr/`: Módulo de procesamiento de documentos y extracción OCR.

## 🚀 Requisitos Previos

* **Python 3.12+** (administrado con `uv`)
* **Bun 1.0+**
* **PostgreSQL** & **Redis** (para ejecuciones en entorno de desarrollo/producción)

## ⚡ Comandos Rápidos (`Makefile`)

El proyecto utiliza un `Makefile` estandarizado para simplificar el flujo de trabajo:

```bash
# 1. Instalar dependencias del backend y frontend
make setup

# 2. Iniciar servidores de desarrollo
make dev-backend    # Inicia FastAPI en http://localhost:8000
make dev-frontend   # Inicia React Frontend en http://localhost:3000

# 3. Ejecutar suite de verificación (Linter, Build y Tests)
make check

# 4. Ejecutar solamente pruebas unitarias / de integración
make test
```

## 🔐 Configuración del Entorno

Copia el archivo `.env.example` a `.env` y configura las variables requeridas según tu entorno local:

```bash
cp .env.example .env
```
