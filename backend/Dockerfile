# syntax=docker/dockerfile:1

FROM python:3.12.4-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1
WORKDIR /app
RUN addgroup --system app && adduser --system --ingroup app --no-create-home appuser

# ---------------------------------------------------------------------------
# dev-deps: full requirements.txt (app + pytest/ruff/factory_boy/...)
# ---------------------------------------------------------------------------
FROM base AS dev-deps
COPY requirements.txt ./
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

# ---------------------------------------------------------------------------
# prod-deps: runtime-only requirements-prod.txt (no test/lint tooling)
# ---------------------------------------------------------------------------
FROM base AS prod-deps
COPY requirements-prod.txt ./
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements-prod.txt

# ---------------------------------------------------------------------------
# dev: local development image -- runs against bind-mounted source, so the
# actual app code is provided by the docker-compose volume, not COPY'd here.
# ---------------------------------------------------------------------------
FROM dev-deps AS dev
COPY docker/entrypoint.sh /app/docker/entrypoint.sh
RUN chmod +x /app/docker/entrypoint.sh
COPY . .
ENV DJANGO_SETTINGS_MODULE=config.settings.dev
EXPOSE 8000
# Stays root: source + db.sqlite3 are bind-mounted from the host here, owned
# by the host user, so a container-local appuser can't write to them. Not a
# security boundary in dev -- the prod stage (immutable, no bind mounts) is
# non-root.
ENTRYPOINT ["/app/docker/entrypoint.sh"]
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# ---------------------------------------------------------------------------
# prod: immutable image, no bind mounts, gunicorn as PID 1's child via exec.
# ---------------------------------------------------------------------------
FROM base AS prod
COPY --from=prod-deps /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=prod-deps /usr/local/bin /usr/local/bin
COPY docker/entrypoint.sh /app/docker/entrypoint.sh
RUN chmod +x /app/docker/entrypoint.sh
COPY --chown=appuser:app . .
RUN mkdir -p /app/logs && chown appuser:app /app/logs
ENV DJANGO_SETTINGS_MODULE=config.settings.prod
EXPOSE 8000
USER appuser
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health/', timeout=3)" || exit 1
ENTRYPOINT ["/app/docker/entrypoint.sh"]
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "60"]
