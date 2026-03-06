# 🐳 Docker + Kubernetes Demo

App mínima de notas: **frontend (nginx) → backend (Node.js) → PostgreSQL**

```
frontend:8080  ──►  backend:3000  ──►  postgres:5432
   nginx             Express             PostgreSQL
```

---

## 🚀 Opción 1 — Docker Compose (desarrollo local)

```bash
# Levantar todo con un comando
docker compose up --build

# App disponible en:
# http://localhost:8080  → Frontend
# http://localhost:3000  → Backend API
```

```bash
# Parar y borrar volúmenes
docker compose down -v
```

---

## ☸️ Opción 2 — Kubernetes (Minikube)

### Prerequisitos
```bash
# Instalar Minikube
brew install minikube       # macOS
# o: https://minikube.sigs.k8s.io/docs/start/

minikube start
```

### Build de imágenes dentro de Minikube
```bash
# Apuntar Docker al daemon de Minikube
eval $(minikube docker-env)

# Build de las imágenes
docker build -t demo-backend:latest ./backend
docker build -t demo-frontend:latest ./frontend
```

### Deploy al cluster
```bash
# Aplicar manifests en orden
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
```

### Ver el estado
```bash
kubectl get pods          # todos los pods corriendo
kubectl get services      # ver IPs y puertos
kubectl get deployments   # réplicas activas
```

### Acceder a la app
```bash
# Con Minikube:
minikube service frontend

# Con un cluster real, el LoadBalancer asigna IP externa:
kubectl get svc frontend
```

### Logs y debug
```bash
kubectl logs -l app=backend       # logs del backend
kubectl logs -l app=postgres      # logs de postgres
kubectl describe pod <pod-name>   # detalle de un pod
```

### Limpiar
```bash
kubectl delete -f k8s/
minikube stop
```

---

## 📁 Estructura

```
demo-app/
├── frontend/
│   ├── index.html        ← Single-page app
│   ├── nginx.conf        ← Config de nginx + proxy al backend
│   └── Dockerfile
├── backend/
│   ├── index.js          ← Express API (GET/POST/DELETE /notes)
│   ├── package.json
│   └── Dockerfile
├── k8s/
│   ├── postgres.yaml     ← Deployment + Service + PVC + Secret
│   ├── backend.yaml      ← Deployment (2 réplicas) + Service
│   └── frontend.yaml     ← Deployment (2 réplicas) + LoadBalancer
└── docker-compose.yml    ← Setup completo para desarrollo local
```

---

## 🔄 CI/CD — GitHub Actions

Al hacer **push** a `main` o `master`, el workflow construye las imágenes Docker y las publica en **GitHub Container Registry** (ghcr.io):

| Imagen | Tag |
|--------|-----|
| Backend | `ghcr.io/<tu-usuario>/notas-backend:latest` |
| Frontend | `ghcr.io/<tu-usuario>/notas-frontend:latest` |

**Permisos necesarios:** En el repo → Settings → Actions → General → Workflow permissions → **Read and write**.

Para usar las imágenes en Kubernetes, haz login:
```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u <tu-usuario> --password-stdin
```

---

## 🔑 Conceptos de K8s demostrados

| Recurso | Para qué sirve |
|---|---|
| `Deployment` | Declara cuántas réplicas correr y cómo actualizarlas |
| `Service (ClusterIP)` | DNS interno entre pods (ej: `postgres`, `backend`) |
| `Service (LoadBalancer)` | Expone el frontend al mundo exterior |
| `PersistentVolumeClaim` | El disco de Postgres sobrevive reinicios de pods |
| `Secret` | Credenciales encriptadas (no hardcodeadas en el código) |
| `readinessProbe` | K8s sabe cuándo un pod está listo para recibir tráfico |
| `resources` | Límites de CPU/RAM por contenedor |

---

## 🌐 API del backend

```
GET    /health       → { status: "ok" }
GET    /notes        → [ { id, content, created_at }, ... ]
POST   /notes        → body: { content: "texto" }
DELETE /notes/:id    → { deleted: true }
```
