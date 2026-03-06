# web-app k8s deploy

App de ejemplo (nginx) desplegada en OKE (Oracle Kubernetes Engine) free tier.

---

## Prereqs

- Cuenta en Oracle Cloud (free tier)
- `kubectl` instalado
- OCI CLI instalado y configurado

### Instalar OCI CLI (Windows)
```powershell
winget install Oracle.OCI-CLI
```
Luego configurarlo:
```bash
oci setup config
```
Te va a pedir User OCID, Tenancy OCID y Region, todo disponible en la consola de OCI.

## Setup del cluster

Crear el cluster desde la consola de OCI: **Developer Services → Kubernetes Clusters (OKE) → Create Cluster → Quick Create**. Elegir la opción free tier.

Una vez creado, bajar el kubeconfig desde la consola o con:
```bash
oci ce cluster create-kubeconfig --cluster-id <cluster-ocid> --file $HOME/.kube/config --region <region> --token-version 2.0.0
```

Verificar conexión:
```bash
kubectl get nodes
```

## Instalar nginx-ingress-controller

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/cloud/deploy.yaml
```

OCI provisiona automáticamente un Load Balancer público. Esperar a que tenga IP asignada:
```bash
kubectl get svc -n ingress-nginx --watch
```

Cuando aparezca la `EXTERNAL-IP`, esa es la IP pública de la app.

## Deploy

```bash
kubectl apply -f .
```

Verificar:
```bash
kubectl get all -n web-app
kubectl get ingress -n web-app
```

La app queda disponible en `http://<EXTERNAL-IP>`.

## Teardown

```bash
kubectl delete namespace web-app
```

---

## Decisiones de diseño

| Qué | Por qué |
|---|---|
| `nginx:1.25-alpine` | Imagen liviana, sin overhead innecesario |
| Namespace dedicado | Aislamiento, evitar tocar el namespace `default` |
| Ingress en lugar de LoadBalancer | Más realista para producción, un solo punto de entrada HTTP |
| `/healthz` y `/ready` separados | Control granular: liveness reinicia el pod, readiness lo saca del balanceo |
| `maxUnavailable: 0` en RollingUpdate | Cero downtime al actualizar |
| PodDisruptionBudget `minAvailable: 1` | Garantiza disponibilidad durante mantenimiento de nodos |
| HPA (min 2, max 5) | Escalado automático por CPU/memoria |
