# Kyma Deployment Guide - Fashion Trend Alchemist

This directory contains all Kubernetes manifests required to deploy the Fashion Trend Alchemist application to SAP Kyma with **SAP Approuter-based authentication**.

## 🏗️ Current Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Kyma API Gateway (Istio)                             │
│                 fashion-alchemist.a549aaa.kyma.ondemand.com                  │
│                             (Port 5000 - No Auth)                             │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    fashion-alchemist-pod (3 Containers)                      │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    Approuter Container (Port 5000)                     │ │
│  │                      - XSUAA Authentication                            │ │
│  │                      - Session Management                              │ │
│  │                      - JWT Token Handling                              │ │
│  │                      - Request Routing                                 │ │
│  └────────────┬──────────────────────────────────┬────────────────────────┘ │
│               │                                   │                          │
│               ▼                                   ▼                          │
│  ┌────────────────────────┐       ┌────────────────────────────────────┐   │
│  │  Frontend Container    │       │      Backend Container             │   │
│  │   (nginx + React)      │       │    (Node.js + Fastify)             │   │
│  │     Port: 80           │       │       Port: 3001                   │   │
│  │  - Static files        │       │  - API endpoints                   │   │
│  │  - SPA routing         │       │  - Business logic                  │   │
│  │  - No auth logic       │       │  - No JWT validation (trusts       │   │
│  │                        │       │    approuter tokens)               │   │
│  └────────────────────────┘       └────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
    ┌───────────┐            ┌───────────────┐           ┌────────────────┐
    │ PostgreSQL │            │     Redis     │           │ External APIs  │
    │  (existing)│            │   (cache)     │           │ (LLM, AI Core) │
    └───────────┘            └───────────────┘           └────────────────┘
```

## ✨ Key Features

✅ **SAP Approuter** - Industry-standard Cloud Foundry authentication component  
✅ **Zero Trust Backend** - Backend doesn't validate tokens (handled by approuter)  
✅ **Session Management** - Approuter manages user sessions and token refresh  
✅ **3-Container Architecture** - Approuter + Frontend + Backend  
✅ **XSUAA Integration** - Full SAP BTP authentication support  
✅ **CI/CD Ready** - Automated builds and deployments via GitHub Actions

## 📊 Architecture Details

### Request Flow

1. **User Request** → Kyma Gateway (no auth, routes to approuter:5000)
2. **Approuter** → Checks for valid XSUAA session
   - ✅ Valid session → Forward request with JWT token
   - ❌ No session → Redirect to XSUAA login
3. **XSUAA Login** → User authenticates with SAP IDP
4. **Callback** → Approuter receives OAuth2 code, exchanges for JWT
5. **Session Created** → Approuter stores session, forwards requests
6. **Routing**:
   - `/api/*` → Backend container (port 3001) with JWT in header
   - `/*` → Frontend container (port 80) for static files

### Container Responsibilities

| Container | Port | Purpose                    | Authentication       |
| --------- | ---- | -------------------------- | -------------------- |
| Approuter | 5000 | Entry point, auth, routing | XSUAA OAuth2 + JWT   |
| Frontend  | 80   | React SPA, static files    | None (via approuter) |
| Backend   | 3001 | API, business logic        | Trusts approuter     |

## 📁 File Structure

```
k8s/
├── kustomization.yaml           # Kustomize orchestration
├── xsuaa-instance.yaml          # XSUAA OAuth2 service
├── xsuaa-binding.yaml           # Creates k8s secret with credentials
├── vcap-services-job.yaml       # Generates VCAP_SERVICES for approuter
├── redis.yaml                   # Redis cache deployment
├── app-configmap.yaml           # Non-sensitive app config
├── approuter-configmap.yaml     # Approuter destinations config
├── secrets.yaml                 # Sensitive credentials (⚠️ DO NOT COMMIT!)
├── deployment.yaml              # 3-container pod definition
├── service.yaml                 # Internal service endpoints
└── apirule.yaml                 # Kyma gateway routing (no auth)
```

## 🚀 Quick Start

### Prerequisites

1. **Kyma cluster access** with `kubectl` configured
2. **Docker Hub account** (or registry access)
3. **PostgreSQL** already deployed in namespace
4. **SAP BTP** XSUAA service instance
5. **GitHub** repository with Actions enabled

### 1. Configure Secrets

#### Update `k8s/secrets.yaml`:

⚠️ **CRITICAL**: Replace ALL placeholder values with real credentials:

```yaml
# Database Configuration
PGHOST: 'your-postgres-host'
PGPASSWORD: 'your-secure-password'

# LLM Configuration
LITELLM_API_KEY: 'your-litellm-key'

# SAP AI Core
CLIENT_SECRET: 'your-ai-core-secret'

# Image Generation
IMAGE_GEN_CLIENT_SECRET: 'your-image-gen-secret'

# Frontend Build-Time Variables (used during Docker build)
VITE_FILER_BASE_URL: 'https://seaweedfs.a549aaa.kyma.ondemand.com'
VITE_FILER_BUCKET: 'images'
VITE_FILER_GENERATED_BUCKET: 'generatedProducts'
```

#### Configure GitHub Secrets:

Go to: `https://github.tools.sap/YOUR_ORG/The-Fashion-Trend-Alchemist/settings/secrets/actions`

Add these secrets:

```
DOCKERHUB_USERNAME=danylopolishchuk884
DOCKERHUB_TOKEN=<your-docker-hub-token>
KUBECONFIG_BASE64=<base64-encoded-kubeconfig>
VITE_FILER_BASE_URL=https://seaweedfs.a549aaa.kyma.ondemand.com
VITE_FILER_BUCKET=images
VITE_FILER_GENERATED_BUCKET=generatedProducts
```

**To encode kubeconfig:**

```bash
# macOS
cat ~/.kube/config | base64 | pbcopy

# Linux
cat ~/.kube/config | base64 -w 0
```

### 2. Deploy via CI/CD (Recommended)

Simply push to main branch:

```bash
git add .
git commit -m "Deploy to Kyma"
git push origin main
```

**GitHub Actions will automatically:**

1. Build 3 Docker images (approuter, api, web)
2. Push to Docker Hub
3. Restart Kubernetes deployment
4. Wait for pods to be ready
5. Verify deployment status

**Deployment Status:**

- View progress: `https://github.tools.sap/YOUR_ORG/The-Fashion-Trend-Alchemist/actions`
- Deployment takes ~6-8 minutes total

### 3. Manual Deployment (Alternative)

If you need to deploy manually:

```bash
# Build images locally
export REGISTRY="danylopolishchuk884"

# Build approuter
docker build --platform linux/amd64 \
  -t ${REGISTRY}/fashion-alchemist-approuter:latest \
  -f apps/approuter/Dockerfile .
docker push ${REGISTRY}/fashion-alchemist-approuter:latest

# Build backend
docker build --platform linux/amd64 \
  -t ${REGISTRY}/fashion-alchemist-api:latest \
  -f apps/api-lite/Dockerfile .
docker push ${REGISTRY}/fashion-alchemist-api:latest

# Build frontend (requires build args!)
docker build --platform linux/amd64 \
  --build-arg VITE_FILER_BASE_URL="https://seaweedfs.a549aaa.kyma.ondemand.com" \
  --build-arg VITE_FILER_BUCKET="images" \
  --build-arg VITE_FILER_GENERATED_BUCKET="generatedProducts" \
  -t ${REGISTRY}/fashion-alchemist-web:latest \
  -f apps/web/Dockerfile .
docker push ${REGISTRY}/fashion-alchemist-web:latest

# Deploy to Kubernetes
kubectl apply -k k8s/

# Monitor deployment
kubectl get pods -n danispace -l app=fashion-alchemist -w
```

## 🔍 Verification & Monitoring

### Check Deployment Status

```bash
# Pod status (should show 3/3 READY)
kubectl get pods -n danispace -l app=fashion-alchemist

# Expected output:
# NAME                                    READY   STATUS    RESTARTS   AGE
# fashion-alchemist-pod-xxxxxxxxxx-xxxxx   3/3     Running   0          5m

# Check XSUAA resources
kubectl get serviceinstances,servicebindings -n danispace

# Verify XSUAA credentials secret
kubectl get secret fashion-alchemist-xsuaa-credentials -n danispace

# Check VCAP_SERVICES configmap (needed by approuter)
kubectl get configmap vcap-services -n danispace -o yaml

# Check APIRule
kubectl get apirule fashion-alchemist-web -n danispace
```

### View Container Logs

```bash
# Approuter logs (authentication & routing)
kubectl logs -n danispace -l app=fashion-alchemist -c approuter --tail=100 -f

# Backend logs (API & business logic)
kubectl logs -n danispace -l app=fashion-alchemist -c backend --tail=100 -f

# Frontend logs (nginx access logs)
kubectl logs -n danispace -l app=fashion-alchemist -c frontend --tail=100 -f

# All containers together
kubectl logs -n danispace -l app=fashion-alchemist --all-containers=true --tail=50
```

### Test Application

```bash
# Access the application
open https://fashion-alchemist.a549aaa.kyma.ondemand.com

# Test health endpoints
kubectl exec -n danispace -l app=fashion-alchemist -c backend -- \
  curl -s http://localhost:3001/health

kubectl exec -n danispace -l app=fashion-alchemist -c frontend -- \
  curl -s http://localhost:80/health
```

## 🔧 Configuration Details

### Approuter Configuration

**`apps/approuter/xs-app.json`:**

```json
{
  "welcomeFile": "/index.html",
  "authenticationMethod": "route",
  "sessionTimeout": 30,
  "routes": [
    {
      "source": "^/api/(.*)$",
      "destination": "backend-api",
      "authenticationType": "xsuaa",
      "csrfProtection": false
    },
    {
      "source": "^/(.*)$",
      "destination": "app-frontend",
      "authenticationType": "xsuaa"
    }
  ]
}
```

**Key Points:**

- `authenticationType: "xsuaa"` - All routes require authentication
- `/api/*` → Backend (port 3001) with JWT forwarding
- `/*` → Frontend (port 80) for React SPA
- `sessionTimeout: 30` - 30 minute session timeout

### APIRule Configuration

**`k8s/apirule.yaml`:**

```yaml
service:
  name: fashion-alchemist-pod
  port: 5000 # Routes to approuter

rules:
  - path: /{**}
    noAuth: true # Gateway doesn't validate (approuter handles it)
```

**Why `noAuth: true`?**

- Kyma Gateway forwards ALL traffic to approuter
- Approuter handles XSUAA authentication
- This is the standard pattern for approuter-based apps

### Environment Variables

#### Backend Container

**From `fashion-alchemist-secrets`:**

- Database: `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`
- Redis: `REDIS_URL`
- LLM: `LITELLM_PROXY_URL`, `LITELLM_API_KEY`, `VISION_LLM_MODEL`
- AI Core: `AI_API_URL`, `AUTH_URL`, `CLIENT_ID`, `CLIENT_SECRET`, `RESOURCE_GROUP`
- Image Gen: `IMAGE_GEN_TOKEN_URL`, `IMAGE_GEN_CLIENT_ID`, `IMAGE_GEN_CLIENT_SECRET`, `IMAGE_GEN_API_URL`
- Frontend URLs: `VITE_FILER_BASE_URL`, `VITE_FILER_BUCKET`, `VITE_FILER_GENERATED_BUCKET`

**From `fashion-alchemist-xsuaa-credentials` (auto-generated):**

- `XSUAA_CLIENT_ID`, `XSUAA_CLIENT_SECRET`, `XSUAA_URL`
- `XSUAA_UAA_DOMAIN`, `XSUAA_VERIFICATION_KEY`, `XSUAA_XSAPPNAME`

#### Approuter Container

**From `vcap-services` ConfigMap:**

- `VCAP_SERVICES` - XSUAA binding in Cloud Foundry format

**From `approuter-destinations` ConfigMap:**

- `destinations` - Routing configuration for backend and frontend

#### Frontend Container

**Build-time only** (baked into JavaScript bundle):

- `VITE_FILER_BASE_URL`
- `VITE_FILER_BUCKET`
- `VITE_FILER_GENERATED_BUCKET`

⚠️ **Important**: Frontend VITE\_ variables cannot be changed at runtime. If you need to change them:

1. Update `k8s/secrets.yaml`
2. Update GitHub Secrets
3. Rebuild frontend image with new `--build-arg` values
4. Redeploy

## 🐛 Troubleshooting

### Authentication Issues

```bash
# Check approuter logs for XSUAA errors
kubectl logs -n danispace -l app=fashion-alchemist -c approuter | grep -i "error\|401\|403"

# Verify XSUAA credentials are mounted
kubectl exec -n danispace -l app=fashion-alchemist -c approuter -- \
  env | grep VCAP_SERVICES

# Check if XSUAA service instance is ready
kubectl get serviceinstance fashion-alchemist-xsuaa-instance -n danispace -o yaml

# Test XSUAA endpoint connectivity
kubectl exec -n danispace -l app=fashion-alchemist -c approuter -- \
  wget -O- https://digital-labs-azure-kyma.authentication.jp20.hana.ondemand.com/oauth/token
```

### Pod CrashLoopBackOff

```bash
# Check which container is failing
kubectl describe pod -n danispace -l app=fashion-alchemist

# Common issues:
# 1. Approuter: Missing VCAP_SERVICES
kubectl get configmap vcap-services -n danispace

# 2. Backend: Database connection failed
kubectl logs -n danispace -l app=fashion-alchemist -c backend | grep -i "postgres\|database"

# 3. Frontend: Build failed (check Docker build logs in GitHub Actions)
```

### Routing Issues

```bash
# Test approuter can reach backend
kubectl exec -n danispace -l app=fashion-alchemist -c approuter -- \
  curl -s http://localhost:3001/health

# Test approuter can reach frontend
kubectl exec -n danispace -l app=fashion-alchemist -c approuter -- \
  curl -s http://localhost:80/health

# Check approuter destinations config
kubectl get configmap approuter-destinations -n danispace -o yaml
```

### CI/CD Failures

```bash
# View GitHub Actions logs
# Go to: https://github.tools.sap/YOUR_ORG/The-Fashion-Trend-Alchemist/actions

# Common issues:
# 1. Docker build fails - Check Dockerfile syntax
# 2. Push fails - Verify DOCKERHUB_TOKEN secret
# 3. Deploy fails - Verify KUBECONFIG_BASE64 secret
# 4. Rollout timeout - Check pod logs for startup errors
```

## 🔐 Security Best Practices

### Secrets Management

**⚠️ NEVER commit `k8s/secrets.yaml` with real values!**

**Options:**

#### Option 1: Sealed Secrets (Recommended)

```bash
# Install sealed-secrets controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.18.0/controller.yaml

# Create sealed secret
kubeseal --format=yaml < k8s/secrets.yaml > k8s/sealed-secrets.yaml

# Commit sealed-secrets.yaml (safe to commit)
git add k8s/sealed-secrets.yaml
```

#### Option 2: Manual Secret Creation

```bash
# Create secret manually in cluster (don't commit secrets.yaml)
kubectl create secret generic fashion-alchemist-secrets \
  --from-literal=PGHOST=... \
  --from-literal=PGPASSWORD=... \
  -n danispace
```

#### Option 3: External Secrets Operator

```bash
# Use AWS Secrets Manager, Azure Key Vault, or SAP Credential Store
# Install external-secrets operator
# Configure SecretStore and ExternalSecret resources
```

### XSUAA Security

1. **Redirect URIs**: Ensure only valid URIs in `xsuaa-instance.yaml`
2. **Token Lifetime**: Configure appropriate expiration in XSUAA
3. **Scopes**: Define role-based scopes if needed
4. **Regular Rotation**: Rotate XSUAA client secrets periodically

### Network Security

- **No external database access**: Backend connects via internal service
- **Redis internal only**: Not exposed outside cluster
- **Approuter as gateway**: Single entry point for authentication

## 📈 Performance & Monitoring

### Resource Allocation

| Container | Memory Request | Memory Limit | CPU Request | CPU Limit |
| --------- | -------------- | ------------ | ----------- | --------- |
| Approuter | 128Mi          | 256Mi        | 50m         | 100m      |
| Frontend  | 128Mi          | 256Mi        | 50m         | 100m      |
| Backend   | 512Mi          | 1Gi          | 250m        | 500m      |
| **Total** | **768Mi**      | **1.5Gi**    | **350m**    | **700m**  |

### Health Checks

All containers have liveness and readiness probes:

- **Approuter**: `GET /` on port 5000
- **Frontend**: `GET /health` on port 80
- **Backend**: `GET /health` on port 3001

### Monitoring

```bash
# Pod resource usage
kubectl top pods -n danispace -l app=fashion-alchemist

# Watch pod status
kubectl get pods -n danispace -l app=fashion-alchemist -w

# View recent events
kubectl get events -n danispace --field-selector involvedObject.name=fashion-alchemist-pod-*
```

## 🔄 Deployment Strategies

### Rolling Update (Default)

```bash
# CI/CD automatically does rolling restart
kubectl rollout restart deployment/fashion-alchemist-pod -n danispace

# Watch rollout progress
kubectl rollout status deployment/fashion-alchemist-pod -n danispace

# Check rollout history
kubectl rollout history deployment/fashion-alchemist-pod -n danispace
```

### Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/fashion-alchemist-pod -n danispace

# Rollback to specific revision
kubectl rollout undo deployment/fashion-alchemist-pod -n danispace --to-revision=3
```

### Scale Replicas

```bash
# Scale to 2 replicas (for high availability)
kubectl scale deployment/fashion-alchemist-pod -n danispace --replicas=2

# Note: Approuter manages sessions, so sticky sessions not required
```

## 🧹 Cleanup

### Remove Application

```bash
# Delete all resources
kubectl delete -k k8s/

# Or selectively delete
kubectl delete deployment fashion-alchemist-pod -n danispace
kubectl delete service fashion-alchemist-pod -n danispace
kubectl delete apirule fashion-alchemist-web -n danispace
```

### Remove XSUAA Resources

```bash
# Delete service binding (deletes credentials secret)
kubectl delete servicebinding fashion-alchemist-xsuaa-binding -n danispace

# Delete service instance (takes ~2 minutes)
kubectl delete serviceinstance fashion-alchemist-xsuaa-instance -n danispace
```

## 📚 Additional Resources

- [SAP Approuter Documentation](https://www.npmjs.com/package/@sap/approuter)
- [SAP XSUAA Service](https://help.sap.com/docs/btp/sap-business-technology-platform/xsuaa)
- [Kyma APIRule](https://kyma-project.io/#/api-gateway/user/custom-resources/apirule/04-10-apirule)
- [GitHub Actions](https://docs.github.com/en/actions)

## 🆘 Support

### Common Issues

1. **"No UAA service found"** (Approuter error)
   - Check VCAP_SERVICES configmap exists
   - Verify XSUAA binding completed successfully

2. **401 Unauthorized**
   - Clear browser cookies
   - Check XSUAA service instance is ready
   - Verify redirect URIs in xsuaa-instance.yaml

3. **Frontend shows "Network Error"**
   - Check backend container logs
   - Verify approuter routing config
   - Test backend health endpoint

4. **Slow initial load**
   - XSUAA service instance provisioning takes ~2 minutes
   - First pod startup takes ~30 seconds
   - Subsequent restarts are faster (~10 seconds)

### Getting Help

```bash
# Collect diagnostic information
kubectl get all -n danispace -l app=fashion-alchemist
kubectl describe pod -n danispace -l app=fashion-alchemist
kubectl logs -n danispace -l app=fashion-alchemist --all-containers=true --tail=200

# Export for sharing
kubectl get deployment fashion-alchemist-pod -n danispace -o yaml > deployment-debug.yaml
```
