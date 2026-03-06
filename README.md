# App estática en Kubernetes (namespace abstracta)

Aplicación web estática (HTML + nginx) que se despliega en un cluster de Kubernetes dentro del namespace **abstracta**. Incluye health checks, 2 réplicas y acceso vía Ingress.

---

## ¿Qué hace este proyecto?

1. **Construye una imagen Docker** con nginx que sirve un `index.html` estático (página de presentación “Hellow Abstracta hire me !!!”).
2. **Despliega esa app en Kubernetes** en el namespace `abstracta`, con:
   - **ConfigMap**: configuración de nginx (incluye el endpoint `/healthz` para las probes).
   - **Deployment**: 2 réplicas de la imagen, con liveness/readiness usando `/healthz`.
   - **Service**: LoadBalancer para exponer el tráfico.
   - **Ingress**: entrada HTTP (clase nginx) que envía el tráfico al Service.

La configuración de nginx se inyecta en runtime desde el ConfigMap, así que puedes cambiar el comportamiento sin volver a construir la imagen.

---

## Estructura del proyecto

```
.
├── 00-namespace.yaml    # Crea el namespace "abstracta"
├── 01-configmap.yaml    # ConfigMap con nginx.conf (root, /healthz)
├── 02-deployment.yaml   # Deployment: 2 réplicas, imagen nginx-app:latest
├── 03-service.yaml      # Service tipo LoadBalancer
├── 04-ingress.yaml      # Ingress (clase nginx, path /)
├── Dockerfile           # Imagen: nginx:alpine + index.html
├── index.html           # Página estática que sirve la app
└── README.md
```

---

## Cómo ejecutarlo

### 1. Construir la imagen Docker

Desde la raíz del proyecto (donde está el `Dockerfile` y `index.html`):

```bash
docker build -t nginx-app:latest .
```

### 2. Usar la imagen en Kubernetes

El Deployment usa `image: nginx-app:latest` y `imagePullPolicy: Never`, así que espera la imagen en el nodo donde corren los pods.

**Con Minikube:**

```bash
eval $(minikube docker-env)
docker build -t nginx-app:latest .
```

**Con un cluster remoto:** tendrías que subir la imagen a un registry y cambiar en `02-deployment.yaml` la imagen y `imagePullPolicy` (por ejemplo `IfNotPresent` o `Always`).

### 3. Aplicar los manifests en orden

```bash
kubectl apply -f 00-namespace.yaml
kubectl apply -f 01-configmap.yaml
kubectl apply -f 02-deployment.yaml
kubectl apply -f 03-service.yaml
kubectl apply -f 04-ingress.yaml
```

O todo de una vez:

```bash
kubectl apply -f .
```

### 4. Acceder a la app

- **Con Ingress (nginx controller instalado):** la ruta `/` queda expuesta según la configuración del Ingress (por ejemplo, host o IP del controller).
- **Sin Ingress:** usar el Service LoadBalancer:
  ```bash
  kubectl get svc -n abstracta nginx-app-svc
  ```
  y abrir la IP externa en el puerto 80.

---

## Recursos de Kubernetes utilizados

| Archivo              | Recurso    | Descripción |
|----------------------|------------|-------------|
| `00-namespace.yaml`  | Namespace  | Namespace `abstracta` donde vive todo. |
| `01-configmap.yaml`  | ConfigMap  | `nginx.conf` con `listen 80`, `root`, `/healthz` y `location /`. |
| `02-deployment.yaml` | Deployment | 2 réplicas de `nginx-app:latest`, monta el ConfigMap en `/etc/nginx/conf.d/default.conf`, probes en `/healthz`, requests/limits de CPU y memoria. |
| `03-service.yaml`    | Service    | LoadBalancer que apunta a los pods `app: nginx-app` en el puerto 80. |
| `04-ingress.yaml`    | Ingress    | Regla HTTP path `/` hacia `nginx-app-svc:80`, clase nginx. |

---

## Health checks

El ConfigMap define la ruta `/healthz`. El Deployment la usa en:

- **livenessProbe:** si falla, Kubernetes reinicia el contenedor.
- **readinessProbe:** si falla, el pod no recibe tráfico hasta que responda bien.

Así nginx solo recibe tráfico cuando está listo y se reinicia si deja de responder.

---

## Requisitos

- Cluster de Kubernetes (por ejemplo Minikube).
- Para Ingress: controlador de Ingress nginx instalado (p. ej. `ingress-nginx`).
- Imagen `nginx-app:latest` construida y disponible en el cluster (local con `imagePullPolicy: Never` o desde un registry si cambias el manifest).
