---
name: docker-standards
description: >
  Production-grade Docker & containerization standards. Use this skill whenever 
  creating, editing, or reviewing a Dockerfile, docker-compose.yml, container CI/CD 
  pipeline (GitHub Actions image build/push), or Kubernetes manifests derived from 
  containers. Applies to any language/stack (Python/Django/DRF/FastAPI, Next.js, 
  Node, Celery workers, PostgreSQL/Redis services). Ensures senior/industry-level 
  quality — not tutorial-level Dockerfiles.
---

# Docker Implementation Standard (Industry / Senior-Level)

This is the non-negotiable baseline for any container work in this project or 
any project. Follow it end-to-end unless the user explicitly says "quick 
prototype only, skip production hardening."

## 1. Dockerfile Design

- **Always multi-stage build.** Minimum 2 stages: `builder` (compile 
  deps/assets) → `runtime` (slim, only what's needed to run).
- **Base image:** prefer `-slim` or `-alpine` variants. Pin exact versions 
  (`python:3.12.4-slim`, not `python:3-slim`, not `latest`).
- **Layer ordering for cache efficiency:** copy dependency manifests 
  (`requirements.txt`, `package.json`+lock) and install deps *before* 
  copying application source code, so code changes don't invalidate the 
  dependency-install layer.
- **`.dockerignore` is mandatory** — exclude `.git`, `node_modules`, `venv`, 
  `__pycache__`, `.env*`, test artifacts, docs, `.github`.
- **Never `COPY . .` blindly before installing deps.** Split it.
- **Non-root user always.** Create a dedicated user (`RUN adduser --disabled-password appuser`), 
  `USER appuser` before `CMD`/`ENTRYPOINT`. Root containers are a security review 
  failure in any serious org.
- **No secrets baked into images** — ever. No `.env` files copied in, no API 
  keys as `ARG`/`ENV` in final image layers (build-time secrets leak into 
  image history). Use BuildKit `--mount=type=secret` for build-time secrets, 
  and runtime env injection (compose `env_file`, K8s Secrets, AWS SSM/Secrets 
  Manager) for runtime secrets.
- **Use BuildKit** (`DOCKER_BUILDKIT=1` or Compose v2 default) for cache 
  mounts (`--mount=type=cache,target=/root/.cache/pip`) — massively speeds 
  up rebuilds for pip/npm/apt.
- **Explicit `WORKDIR`**, never rely on default.
- **`EXPOSE` the actual port**, document it — doesn't publish, just documentation 
  + tooling hint.
- **Graceful shutdown:** use exec-form `CMD`/`ENTRYPOINT` (`["gunicorn", ...]`, 
  not shell form `CMD gunicorn ...`) so the process receives SIGTERM directly 
  as PID 1 and can shut down cleanly. For apps needing proper signal handling / 
  zombie reaping, use `tini` or `--init` flag.

## 2. Image Size & Supply Chain

- Remove build tools/compilers from the final runtime stage (they only exist 
  in the builder stage).
- Combine `RUN apt-get update && apt-get install -y X && rm -rf /var/lib/apt/lists/*` 
  in a single layer to avoid bloat.
- Run vulnerability scanning in CI: `docker scout cves` or `trivy image <image>` 
  before pushing to registry. Fail the pipeline on CRITICAL/HIGH CVEs (with an 
  allowlist mechanism for accepted risk).
- Use image-slimming awareness (`dive <image>` to inspect layer bloat) during 
  development, not as a CI gate.

## 3. Health, Resources, Logging (Production Concerns)

- **HEALTHCHECK** in Dockerfile or compose/K8s probes — app must expose a 
  `/health` or `/healthz` endpoint that checks DB/Redis connectivity, not just 
  "process is alive."
- **Resource limits always set** — CPU and memory limits/requests in 
  docker-compose (`deploy.resources`) and mandatory in Kubernetes 
  (`resources.requests` / `resources.limits`). Unbounded containers are a 
  production incident waiting to happen (noisy-neighbor OOM kills).
- **Logging:** app logs to **stdout/stderr only** — never write log files 
  inside the container. Let the orchestrator/log driver (json-file with 
  rotation, or a shipper like Fluent Bit/CloudWatch agent) handle collection. 
  This is the 12-factor app principle.
- **Structured logging** (JSON logs) in production so log aggregators 
  (CloudWatch, ELK, Loki) can parse fields, not just grep raw text.

## 4. Compose vs Kubernetes — When to Use Which

- **Docker Compose:** local dev, staging on a single host, small deployments 
  (e.g. Railway-style single-VM setups like Remake_X). Fast iteration, simple 
  mental model.
- **Kubernetes:** when you need autoscaling, multi-node scheduling, rolling 
  zero-downtime deploys, self-healing at scale, multi-tenant isolation 
  (relevant for ShopOS as a multi-tenant SaaS). Adds real operational 
  overhead — don't reach for K8s just because it's "senior," reach for it 
  when Compose genuinely can't meet the scaling/HA requirement.
- Use **Compose profiles** to separate dev-only services (e.g. mailhog, 
  pgadmin) from the core stack so `docker compose up` stays clean in CI.

## 5. Networking & Data

- **Custom bridge networks per project**, not the default bridge — enables 
  DNS-based service discovery (`http://backend:8000` instead of hardcoded IPs).
- **Named volumes for persistent data** (Postgres data, media uploads) — 
  never rely on container-writable-layer storage for anything that must 
  survive a container recreate.
- **Bind mounts only for local dev** (live code reload) — never in 
  production images; production runs the built, immutable image.
- Separate networks for public-facing services vs internal-only services 
  (e.g. DB should not be on the same network as anything internet-exposed) 
  where the orchestrator supports it.

## 6. CI/CD & Registry (GitHub Actions)

- **Tag strategy:** never deploy `:latest` to production. Tag with git SHA 
  (`ghcr.io/org/app:${{ github.sha }}`) and also a semantic/release tag on 
  release branches. `:latest` is for local dev convenience only.
- **Build once, promote everywhere** — build the image once in CI, push to 
  registry, then the *same* image digest is deployed to staging → 
  production. Never rebuild per-environment (risk of environment drift).
- **Use registry caching** (`cache-from`/`cache-to` with GH Actions cache or 
  registry cache) to keep CI build times low.
- **Registry choice:** GHCR (tight GitHub integration, free for public), 
  ECR (if deploying to AWS/EKS/EC2 — matches your stack), Docker Hub (simplest, 
  rate limits on free tier can bite in CI).
- **Sign/verify images** for anything security-sensitive (cosign) — mention 
  as an advanced/optional step for high-compliance environments.

## 7. Problem-Solving Protocol (apply this when debugging Docker issues)

1. Identify root cause first (check `docker logs`, `docker inspect`, 
   `docker events` — don't guess-and-restart).
2. Present the **quick fix** (unblocks now) AND the **proper production fix** 
   (prevents recurrence) — always both, explicitly labeled.
3. Explain trade-offs the way a senior engineer would justify them in a 
   design review (blast radius, ops cost, time-to-fix vs time-to-implement).

## 8. Deliverable Checklist (self-check before calling a Docker setup "done")

- [ ] Multi-stage build, slim/alpine base, pinned version
- [ ] `.dockerignore` present and covers secrets/build artifacts
- [ ] Non-root `USER` set
- [ ] No secrets in image layers — verified via `docker history`
- [ ] HEALTHCHECK / readiness probe defined
- [ ] CPU/memory limits defined
- [ ] Logs go to stdout/stderr only
- [ ] Exec-form CMD/ENTRYPOINT, signal handling sane
- [ ] Image scanned (trivy/docker scout) with no unaddressed CRITICAL CVEs
- [ ] CI tags with git SHA, not floating `:latest`, in production path
- [ ] Named volumes for anything stateful; bind mounts confined to dev

---

**Senior DevOps tip to embed in explanations:** when reviewing any Docker setup, 
ask "if this container dies right now mid-request, what happens?" — that single 
question surfaces most of the gaps above (no health check, no graceful shutdown, 
no resource limit, state stored in the writable layer).