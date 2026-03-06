# Abstracta-Demo

Para este reto decidí levantar el cluster en Oracle Cloud (OKE) dado que ofrece un free tier generoso y lo más importante: provisiona una IP pública automáticamente. Esto permite que el staff de Abstracta pueda acceder a la app directamente desde el browser sin necesidad de instalar nada localmente. De lo contrario, habría que instalar minikube o Docker Desktop con compatibilidad con Kubernetes para replicar el ambiente, lo cual no es práctico para una evaluación.

La app está disponible en: http://167.126.10.248

El repo está en: https://github.com/mauriciocorti/AbstractaTecnica

---

## Preparación

Se necesita tener instalado kubectl y el OCI CLI para conectarse al cluster. Una vez configurado el acceso, el deploy se hace con un solo comando desde la raíz del repo.

Conectar kubectl al cluster:

```bash
oci ce cluster create-kubeconfig --cluster-id <cluster-ocid> --file $HOME/.kube/config --region <region> --token-version 2.0.0
```

Verificar conexión:

```bash
kubectl get nodes
```

## Ingress en lugar de LoadBalancer

Antes de desplegar la app hay que instalar el nginx-ingress-controller:

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/cloud/deploy.yaml
```

La decisión de usar Ingress en lugar de un Service tipo LoadBalancer directo fue intencional. Con LoadBalancer cada servicio que exponés genera un load balancer nuevo en el proveedor de cloud, lo que en producción se vuelve costoso y difícil de gestionar. El Ingress centraliza todo el tráfico HTTP en un único punto de entrada, actúa como reverse proxy y permite agregar más servicios o rutas en el futuro sin provisionar infraestructura adicional. En OCI, el nginx-ingress-controller crea automáticamente un solo OCI Load Balancer con IP pública que maneja todo el tráfico hacia el cluster.

Esperar a que OCI asigne la IP pública:

```bash
kubectl get svc -n ingress-nginx --watch
```

## Deploy

```bash
kubectl apply -f .
```

## Decisiones de diseño

Se eligió nginx:1.25-alpine como imagen base por ser liviana. La app corre en el namespace abstracta-tecnica, aislada del namespace default.

Los health checks tienen dos endpoints separados, /healthz para liveness y /ready para readiness, porque cumplen roles distintos: el liveness probe reinicia el pod si nginx deja de responder, mientras que el readiness probe lo saca del balanceo de carga si todavía no está listo para recibir tráfico. Tenerlos juntos en un mismo endpoint no permite ese control granular.

La estrategia de RollingUpdate está configurada con maxUnavailable en 0, lo que garantiza que durante una actualización nunca haya menos de 2 pods disponibles, asegurando cero downtime.

Se agregó un PodDisruptionBudget con minAvailable en 1 para proteger la disponibilidad durante operaciones de mantenimiento en los nodos, como un drain o una actualización del propio nodo.

Por último se configuró un HorizontalPodAutoscaler con mínimo 2 y máximo 5 réplicas que escala automáticamente según el uso de CPU y memoria, sin necesidad de intervención manual.
