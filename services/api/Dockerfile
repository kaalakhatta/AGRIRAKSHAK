FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    MODEL_BUNDLE_DIR=/app/model

WORKDIR /app
COPY pyproject.toml README.md ./
COPY src ./src
RUN pip install --no-cache-dir .

RUN useradd --create-home --uid 10001 api
USER api

EXPOSE 8000
CMD ["sh", "-c", "uvicorn agrirakshak_api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

