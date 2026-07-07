---
name: devops-kubernetes
description: Production-grade Kubernetes orchestration — Pod/Deployment/StatefulSet/Job patterns, Service + Ingress, ConfigMap + Secret, PersistentVolumeClaim, RBAC + NetworkPolicy, HPA/VPA + PDB, probes + security context, ServiceAccount + IRSA/Workload Identity, Helm + Kustomize + GitOps (Argo CD / Flux), observability (Prometheus + Grafana + OpenTelemetry), troubleshooting, upgrade, cost control, multi-cluster, and audit. The container orchestrator default in the devops cluster. Pairs with `devops-docker` (image build + supply chain), `backend-fastapi` (workload deployment), `backend-engineer` (general), and `devops-ci` (build + GitOps sync).
---

- **Execution**: Run `/k8s <action> [args]`. Actions: `scaffold`, `namespace`, `deployment`, `statefulset`, `daemonset`, `job`, `cronjob`, `service`, `ingress`, `gateway`, `configmap`, `secret`, `pvc`, `rbac`, `networkpolicy`, `hpa`, `vpa`, `pdb`, `probes`, `security-context`, `serviceaccount`, `helm`, `kustomize`, `gitops`, `observability`, `troubleshoot`, `upgrade`, `cost`, `multi-cluster`, `audit`, `deploy`.

# DevOps Kubernetes Protocol

## 1. Mission
Ship Kubernetes workloads that are **declarative, GitOps-synced, autoscaled, hardened, observable, multi-arch, and boring to operate at 3 AM**. The skill owns the conventions a team standardizes on — so 12 services don't end up with 12 different Helm value styles, 12 different probe definitions, and 12 different opinions about whether `latest` belongs in a `Deployment.spec.template`.

> **Core principle:** Every workload is `kubectl apply` reproducible from Git. Every image is pinned by digest (no `:latest`). Every workload has requests + limits, liveness + readiness + startup probes, PDB, and a defined security context. Git is the source of truth; Argo CD / Flux is the only writer to the cluster. `kubectl edit` in prod is a P0 incident, not a routine.

## 2. Standards
Every Kubernetes artifact MUST follow these rules:

- **GitOps-only writes**: cluster state lives in Git, applied by Argo CD / Flux / Fleet. Manual `kubectl apply` is for emergencies, never for routine changes. Drift triggers alerts.
- **Image pin by digest**: every container `image:` references a digest (`registry/app@sha256:...`). Tag is for humans, digest is for machines. No `:latest` in any Deployment/StatefulSet/Job spec that targets prod.
- **Resources always set**: every container has `resources.requests` (cpu, memory, ephemeral-storage) and `resources.limits`. Requests drive scheduler; limits protect the node. No limits = noisy-neighbor outages.
- **Probes always set**: every long-running container has `livenessProbe` (cheap, fast — restarts on failure), `readinessProbe` (gates traffic), and `startupProbe` (slow-start allowance). Probes must match the actual failure mode (don't `curl /` if it 200s even when the DB is down).
- **PDB on every Deployment / StatefulSet**: `minAvailable` or `maxUnavailable` set so voluntary disruptions (drains, upgrades) can't kill the workload. PDB + HPA together.
- **Security context non-root by default**: `runAsNonRoot: true`, `runAsUser: <numeric>`, `runAsGroup: <numeric>`, `readOnlyRootFilesystem: true`, `allowPrivilegeEscalation: false`, `capabilities.drop: ["ALL"]`, `seccompProfile.type: RuntimeDefault`. AppArmor / SELinux profiles where the cluster enforces them.
- **ServiceAccount per workload**: never use `default`. Each workload gets a dedicated SA, with `automountServiceAccountToken: false` unless it actually talks to the API server. IRSA / Workload Identity for AWS/GCP access.
- **NetworkPolicy default-deny**: every namespace starts with a default-deny `NetworkPolicy` (deny all ingress + egress). Explicit allow rules per workload. Don't ship a workload in a namespace without default-deny.
- **Labels standardized**: `app.kubernetes.io/name`, `app.kubernetes.io/instance`, `app.kubernetes.io/version`, `app.kubernetes.io/component`, `app.kubernetes.io/part-of`, `app.kubernetes.io/managed-by`. Used by kubectl, dashboards, selectors, Argo CD.
- **Namespaces are tenancy boundaries**: one namespace per team / per environment / per workload class. `kube-system`, `kube-public`, `flux-system`, `argocd`, `monitoring`, `ingress-nginx` reserved.
- **ConfigMap / Secret externalized**: app config in `ConfigMap`, sensitive in `Secret` (or external secrets via External Secrets Operator / Sealed Secrets / Vault). Never hardcoded in Deployment specs. Mounted as env vars or files.
- **HPA / VPA by workload class**: stateless HTTP → HPA on CPU + custom metrics. Stateful / leader-elected → no HPA, plan capacity instead. Batch jobs → queue-based concurrency.
- **Helm or Kustomize, pick one per repo**: don't mix. Helm when templating + release management matters (3rd-party charts). Kustomize when overlays + patches are clearer (in-house apps).
- **Upgrade path defined**: every cluster upgrade target tracked, every workload tested against new API versions, every CRD compat checked. `kubectl-convert` in CI for removed APIs.
- **Observability non-optional**: Prometheus scrape / OpenTelemetry instrumentation on every workload. Logs to stdout, shipped via Fluent Bit / Vector / Loki. Traces via OpenTelemetry SDK. Metrics, logs, traces linked by trace ID.

## 3. Workflow Actions

### `/k8s scaffold <service>`
Initialize the Kubernetes manifests for a new service.
- Inputs: service name, namespace, image (registry + tag + digest), workload type (Deployment / StatefulSet / DaemonSet / Job), dependencies (DB / cache / broker), environment (dev / staging / prod).
- Outputs: directory layout —
  ```
  deploy/
    base/
      kustomization.yaml
      namespace.yaml
      deployment.yaml
      service.yaml
      serviceaccount.yaml
      configmap.yaml
      secret.yaml          # sealed-secret.yaml or external-secret.yaml in prod
      hpa.yaml
      pdb.yaml
      networkpolicy.yaml
      service-monitor.yaml # Prometheus scrape
      pod-monitor.yaml     # if needed
    overlays/
      dev/kustomization.yaml
      staging/kustomization.yaml
      prod/kustomization.yaml
    charts/               # alternative to kustomize
      service/
        Chart.yaml
        values.yaml
        templates/
    argocd/
      app.yaml             # Argo CD Application
    .argocd-source.yaml    # Argo CD Source
  ```
- Pairs with `/docker scaffold` for image + `/docker push` for registry.

### `/k8s namespace <name_or_team>`
Namespace + tenancy boundary.
- Inputs: name, owner team, labels, resource quota, default-deny NetworkPolicy.
- Outputs:
  ```yaml
  apiVersion: v1
  kind: Namespace
  metadata:
    name: <name>
    labels:
      app.kubernetes.io/part-of: <team>
      pod-security.kubernetes.io/enforce: restricted
      pod-security.kubernetes.io/audit: restricted
      pod-security.kubernetes.io/warn: restricted
  ---
  apiVersion: v1
  kind: ResourceQuota
  metadata: { name: <name>-quota, namespace: <name> }
  spec:
    hard:
      requests.cpu: "100"
      requests.memory: 200Gi
      limits.cpu: "200"
      limits.memory: 400Gi
      pods: "100"
      persistentvolumeclaims: "50"
  ---
  apiVersion: networking.k8s.io/v1
  kind: NetworkPolicy
  metadata: { name: default-deny-all, namespace: <name> }
  spec:
    podSelector: {}
    policyTypes: [Ingress, Egress]
  ```
- Rule: every namespace gets default-deny + quota + Pod Security Standards (`restricted`). Workloads without explicit allow won't talk to anything.

### `/k8s deployment <service>`
Deployment (stateless workload).
- Inputs: name, namespace, image (digest), replicas, resource requests/limits, probes, security context, env, volumes, service account, pod anti-affinity, topology spread.
- Outputs:
  ```yaml
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: <service>
    namespace: <ns>
    labels: {app.kubernetes.io/name: <service>, ...}
  spec:
    replicas: 3
    revisionHistoryLimit: 5
    strategy:
      type: RollingUpdate
      rollingUpdate:
        maxSurge: 25%
        maxUnavailable: 0
    selector:
      matchLabels: {app.kubernetes.io/name: <service>}
    template:
      metadata:
        labels: {app.kubernetes.io/name: <service>, ...}
        annotations:
          prometheus.io/scrape: "true"
          prometheus.io/port: "8080"
      spec:
        serviceAccountName: <service>
        automountServiceAccountToken: false
        securityContext:
          runAsNonRoot: true
          runAsUser: 65532
          runAsGroup: 65532
          fsGroup: 65532
          seccompProfile: {type: RuntimeDefault}
        containers:
        - name: app
          image: registry.example.com/app/service@sha256:<digest>
          imagePullPolicy: IfNotPresent
          ports: [{name: http, containerPort: 8080}]
          resources:
            requests: {cpu: 100m, memory: 128Mi, ephemeral-storage: 64Mi}
            limits:   {cpu: 500m, memory: 512Mi, ephemeral-storage: 256Mi}
          startupProbe:
            httpGet: {path: /health, port: http}
            periodSeconds: 5
            failureThreshold: 30     # up to 150s for slow starts
          readinessProbe:
            httpGet: {path: /health, port: http}
            periodSeconds: 5
            failureThreshold: 2
          livenessProbe:
            httpGet: {path: /health, port: http}
            periodSeconds: 30
            failureThreshold: 3
            timeoutSeconds: 3
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities: {drop: [ALL]}
            runAsNonRoot: true
            runAsUser: 65532
          volumeMounts:
          - {name: tmp, mountPath: /tmp}
          - {name: cache, mountPath: /app/cache}
        volumes:
        - {name: tmp, emptyDir: {sizeLimit: 64Mi}}
        - {name: cache, emptyDir: {sizeLimit: 256Mi}}
        topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: ScheduleAnyway
          labelSelector: {matchLabels: {app.kubernetes.io/name: <service>}}
        affinity:
          podAntiAffinity:
            preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                topologyKey: kubernetes.io/hostname
                labelSelector: {matchLabels: {app.kubernetes.io/name: <service>}}
  ```
- Rule: `replicas >= 2`, anti-affinity across nodes, topology spread across zones, PDB + HPA attached, ServiceAccount dedicated, all three probes set.

### `/k8s statefulset <service>`
StatefulSet (stateful workload — DBs, leader-elected systems).
- Inputs: name, namespace, image (digest), replicas, serviceName (headless), volumeClaimTemplates, init containers, anti-affinity strict.
- Outputs:
  ```yaml
  apiVersion: apps/v1
  kind: StatefulSet
  metadata:
    name: <service>
    namespace: <ns>
  spec:
    serviceName: <service>-headless
    replicas: 3
    selector: {matchLabels: {app.kubernetes.io/name: <service>}}
    template:
      metadata: {labels: {app.kubernetes.io/name: <service>, ...}}
      spec:
        affinity:
          podAntiAffinity:
            requiredDuringSchedulingIgnoredDuringExecution:
            - topologyKey: kubernetes.io/hostname
              labelSelector: {matchLabels: {app.kubernetes.io/name: <service>}}
        # ... container spec same rigor as Deployment
    volumeClaimTemplates:
    - metadata: {name: data}
      spec:
        accessModes: [ReadWriteOnce]
        storageClassName: gp3            # cluster-specific
        resources: {requests: {storage: 100Gi}}
  ```
- Rule: headless Service for stable DNS. Strict anti-affinity. PVC per pod. No HPA on StatefulSet unless you have a custom controller that knows how to scale stateful pods. PodManagementPolicy `OrderedReady` for stable ordering, `Parallel` for faster scale-up.

### `/k8s daemonset <service>`
DaemonSet (one pod per node).
- Inputs: name, namespace, image, node selector, tolerations, update strategy.
- Outputs: `DaemonSet` spec with `updateStrategy.type: RollingUpdate`, `maxUnavailable: 1`, node selector + tolerations to match target nodes. Common: log shippers (Fluent Bit), CNI plugins, node exporters, security agents.

### `/k8s job <purpose>`
Job (run-to-completion).
- Inputs: name, namespace, image, command, parallelism, completions, backoffLimit, activeDeadlineSeconds, restartPolicy (Never / OnFailure).
- Outputs:
  ```yaml
  apiVersion: batch/v1
  kind: Job
  metadata: {name: <job>, namespace: <ns>}
  spec:
    completions: 1
    parallelism: 1
    backoffLimit: 3
    activeDeadlineSeconds: 3600
    ttlSecondsAfterFinished: 86400
    template:
      spec:
        restartPolicy: OnFailure
        serviceAccountName: <job>
        containers:
        - name: job
          image: registry.example.com/app/job@sha256:<digest>
          resources: {requests: {cpu: 100m, memory: 256Mi}, limits: {cpu: 1, memory: 1Gi}}
          # ...
  ```
- Rule: explicit `activeDeadlineSeconds` (don't run forever). `ttlSecondsAfterFinished` for cleanup. `backoffLimit` so it doesn't retry forever.

### `/k8s cronjob <schedule>`
CronJob (scheduled Job).
- Inputs: name, schedule (cron), timezone, concurrencyPolicy (Allow / Forbid / Replace), history limits.
- Outputs:
  ```yaml
  apiVersion: batch/v1
  kind: CronJob
  metadata: {name: <cron>, namespace: <ns>}
  spec:
    schedule: "0 2 * * *"
    timeZone: "Etc/UTC"
    concurrencyPolicy: Forbid
    successfulJobsHistoryLimit: 3
    failedJobsHistoryLimit: 1
    startingDeadlineSeconds: 300
    jobTemplate:
      spec: {...Job spec...}
  ```
- Rule: always `startingDeadlineSeconds` (default 100s is too short). `concurrencyPolicy: Forbid` unless overlap is safe. `timeZone` explicit (don't rely on cluster default).

### `/k8s service <name>`
Service (stable virtual IP for a set of pods).
- Inputs: name, namespace, selector, port, targetPort, type (ClusterIP / NodePort / LoadBalancer / Headless).
- Outputs:
  - **ClusterIP** (default, internal): `apiVersion: v1, kind: Service, spec: {type: ClusterIP, selector: {...}, ports: [...]}`
  - **Headless** (StatefulSet, DNS): `clusterIP: None`
  - **LoadBalancer** (cloud LBs): cloud-specific annotation (`service.beta.kubernetes.io/aws-load-balancer-type: nlb`).
  - **ExternalName** (CNAME to external): rare; prefer real Service.
- Rule: prefer Ingress + ClusterIP over NodePort / LoadBalancer (unless you really need L4). Always set `appProtocol` (HTTP/H2/gRPC) for proper observability.

### `/k8s ingress <name>`
Ingress (L7 HTTP routing).
- Inputs: name, namespace, hostname, path, backend Service, TLS.
- Outputs:
  ```yaml
  apiVersion: networking.k8s.io/v1
  kind: Ingress
  metadata:
    name: <ingress>
    namespace: <ns>
    annotations:
      nginx.ingress.kubernetes.io/backend-protocol: HTTP
      nginx.ingress.kubernetes.io/proxy-body-size: "10m"
      cert-manager.io/cluster-issuer: letsencrypt-prod
      nginx.ingress.kubernetes.io/configuration-snippet: |
        # rate-limit snippet, etc.
  spec:
    ingressClassName: nginx
    tls:
    - hosts: [<hostname>]
      secretName: <tls-secret>
    rules:
    - host: <hostname>
      http:
        paths:
        - path: /
          pathType: Prefix
          backend:
            service:
              name: <service>
              port: {number: 8080}
  ```
- Rule: TLS always. `ingressClassName` explicit. Annotations are controller-specific — nginx, Traefik, HAProxy all differ. For multi-tenant / multi-protocol: use Gateway API instead.

### `/k8s gateway <name>`
Gateway API (L7 successor to Ingress, multi-protocol, multi-tenant).
- Inputs: name, namespace, listeners, hostname, TLS, routes.
- Outputs: `Gateway` resource + `HTTPRoute` / `GRPCRoute` / `TCPRoute`. Used with Gateway API implementations: Istio, Envoy Gateway, Kong, NGINX Gateway Fabric, Traefik.
- Rule: Gateway API is the modern choice. Use Ingress only when your platform requires it.

### `/k8s configmap <name>`
ConfigMap (non-secret configuration).
- Inputs: name, namespace, data (key/value, file mode 0644).
- Outputs:
  ```yaml
  apiVersion: v1
  kind: ConfigMap
  metadata: {name: <name>, namespace: <ns>}
  data:
    app.yaml: |
      server:
        port: 8080
      log:
        level: info
    feature-flags.json: |
      {"newCheckout": true}
  ```
- Consumed by `envFrom: {configMapRef: {name: ...}}` or `volumes: [configMap]`. Never put secrets here — use `Secret` or external secrets.

### `/k8s secret <name>`
Secret (sensitive data) — managed via External Secrets Operator / Sealed Secrets / Vault / ESO / SOPS.
- Inputs: name, namespace, source (Vault path / AWS SM / GCP SM / sealed), target key.
- Outputs: `ExternalSecret` manifest (ESO):
  ```yaml
  apiVersion: external-secrets.io/v1beta1
  kind: ExternalSecret
  metadata: {name: <name>, namespace: <ns>}
  spec:
    refreshInterval: 1h
    secretStoreRef:
      name: vault-backend
      kind: ClusterSecretStore
    target:
      name: <name>     # resulting K8s Secret
    data:
    - secretKey: db-password
      remoteRef:
        key: secret/data/app/db
        property: password
  ```
- Rule: `kubectl get secret -o yaml` is plaintext — don't commit raw Secret manifests. Use encryption at rest (etcd), IRSA for AWS access, Workload Identity for GCP.

### `/k8s pvc <name>`
PersistentVolumeClaim.
- Inputs: name, namespace, storage class, access mode, size, volume mode (Filesystem / Block).
- Outputs:
  ```yaml
  apiVersion: v1
  kind: PersistentVolumeClaim
  metadata: {name: data, namespace: <ns>}
  spec:
    accessModes: [ReadWriteOnce]
    storageClassName: gp3
    resources: {requests: {storage: 100Gi}}
  ```
- Rule: `ReadWriteOnce` for node-attached (EBS, pd.csi), `ReadWriteMany` for shared (EFS, NFS, cephfs). Use volume snapshots for backup (CSI snapshot class).

### `/k8s rbac <subject>`
Role-Based Access Control.
- Inputs: subject (user / ServiceAccount / group), verbs, resources, namespace.
- Outputs:
  - **Namespaced**: `Role` + `RoleBinding`.
  - **Cluster**: `ClusterRole` + `ClusterRoleBinding`.
  - **Aggregated**: `ClusterRole` with `aggregationRule.clusterRoleSelectors`.
- Rule: least privilege. App ServiceAccounts get no API access (`automountServiceAccountToken: false`). CI / GitOps ServiceAccounts get specific verbs. Use `kubectl auth can-i` to verify.

### `/k8s networkpolicy <name>`
NetworkPolicy (default-deny + explicit allow).
- Inputs: namespace, pod selector, ingress allow list (peer namespaces, peer pods, ports), egress allow list (DNS, DB, external APIs).
- Outputs:
  ```yaml
  apiVersion: networking.k8s.io/v1
  kind: NetworkPolicy
  metadata: {name: <name>, namespace: <ns>}
  spec:
    podSelector: {matchLabels: {app.kubernetes.io/name: <service>}}
    policyTypes: [Ingress, Egress]
    ingress:
    - from:
      - namespaceSelector: {matchLabels: {name: ingress-nginx}}
      - podSelector: {matchLabels: {app.kubernetes.io/name: <other>}}
      ports:
      - {protocol: TCP, port: 8080}
    egress:
    - to:
      - namespaceSelector: {matchLabels: {name: kube-system}}
        podSelector: {matchLabels: {k8s-app: kube-dns}}
      ports:
      - {protocol: UDP, port: 53}
    - to:
      - namespaceSelector: {matchLabels: {name: db}}
        podSelector: {matchLabels: {app.kubernetes.io/name: postgres}}
      ports:
      - {protocol: TCP, port: 5432}
  ```
- Rule: every namespace default-deny + every workload explicit allow. DNS egress to kube-dns is the most-forgotten egress rule — apps break silently without it.

### `/k8s hpa <service>`
Horizontal Pod Autoscaler (scale on CPU / memory / custom metrics).
- Inputs: target Deployment / StatefulSet, min/max replicas, metrics.
- Outputs:
  ```yaml
  apiVersion: autoscaling/v2
  kind: HorizontalPodAutoscaler
  metadata: {name: <service>, namespace: <ns>}
  spec:
    scaleTargetRef:
      apiVersion: apps/v1
      kind: Deployment
      name: <service>
    minReplicas: 3
    maxReplicas: 30
    metrics:
    - type: Resource
      resource:
        name: cpu
        target: {type: Utilization, averageUtilization: 70}
    - type: Pods
      pods:
        metric: {name: http_requests_per_second}
        target: {type: AverageValue, averageValue: "1k"}
    behavior:
      scaleDown:
        stabilizationWindowSeconds: 300
        policies: [{type: Percent, value: 50, periodSeconds: 60}]
      scaleUp:
        stabilizationWindowSeconds: 30
        policies: [{type: Percent, value: 100, periodSeconds: 30}, {type: Pods, value: 4, periodSeconds: 30}]
        selectPolicy: Max
  ```
- Rule: HPA + requests set (CPU util doesn't work without requests). Behavior block prevents flapping. Custom metrics via Prometheus Adapter / kube-state-metrics + Prometheus Operator. Combine with Cluster Autoscaler for node scaling.

### `/k8s vpa <service>`
Vertical Pod Autoscaler (right-size resources).
- Inputs: target Deployment, update mode (Off / Initial / Auto).
- Outputs: `VerticalPodAutoscaler` with `resourcePolicy.containerPolicies` and `updatePolicy.updateMode`.
- Rule: VPA in `Off` mode for recommendations only is the safe default. `Auto` mode restarts pods — combine with PodDisruptionBudget. Don't combine HPA + VPA on CPU/memory (they fight); pick one.

### `/k8s pdb <service>`
PodDisruptionBudget.
- Inputs: target workload, minAvailable or maxUnavailable.
- Outputs:
  ```yaml
  apiVersion: policy/v1
  kind: PodDisruptionBudget
  metadata: {name: <service>, namespace: <ns>}
  spec:
    minAvailable: 2          # at least 2 pods always running
    # OR maxUnavailable: 1   # at most 1 pod can be down
    selector: {matchLabels: {app.kubernetes.io/name: <service>}}
  ```
- Rule: every Deployment / StatefulSet gets a PDB. `maxUnavailable: 0` blocks all voluntary disruption — use only with care (drains will hang).

### `/k8s probes <service>`
Probes (liveness / readiness / startup).
- Inputs: probe type (httpGet / tcpSocket / exec / gRPC), path / port, timing, failure thresholds.
- Outputs: probe blocks in pod spec (see `/k8s deployment`). Common patterns:
  - **livenessProbe**: cheap + matches real failure. `httpGet /health` every 30s, 3 retries. Don't make liveness depend on external services — restart loop hell.
  - **readinessProbe**: gates traffic. Should check dependencies (DB / cache reachable) — but use a separate, less-strict probe than liveness.
  - **startupProbe**: gives slow apps time. `failureThreshold * periodSeconds = max startup time`. Remove after `startup` event.
- Rule: liveness ≠ readiness. Restart when truly broken (liveness). Stop sending traffic when not ready (readiness). Give time to start (startup).

### `/k8s security-context <service>`
Pod + container security context.
- Inputs: runAsUser / runAsGroup / fsGroup, runAsNonRoot, readOnlyRootFilesystem, allowPrivilegeEscalation, capabilities, seccompProfile, AppArmor.
- Outputs: `securityContext` at pod AND container level (pod-level for shared, container-level for override). Defaults from Pod Security Standards `restricted` profile.
- Rule: drop ALL capabilities. Run as non-root with numeric UID > 0. Read-only root FS + tmpfs for writable dirs. seccomp RuntimeDefault. AppArmor / SELinux per cluster policy.

### `/k8s serviceaccount <name>`
ServiceAccount + IRSA / Workload Identity.
- Inputs: name, namespace, AWS / GCP / Azure identity annotation.
- Outputs:
  ```yaml
  apiVersion: v1
  kind: ServiceAccount
  metadata:
    name: <service>
    namespace: <ns>
    annotations:
      eks.amazonaws.com/role-arn: arn:aws:iam::<acct>:role/<service>-role
  automountServiceAccountToken: false
  ```
- Rule: never `default`. One SA per workload. IRSA (AWS) / Workload Identity (GCP) / Workload Identity (Azure) for cloud access. `automountServiceAccountToken: false` unless app needs API access.

### `/k8s helm <chart>`
Helm chart (templating + release management).
- Inputs: chart name, version, values (image, replicas, resources, ingress, autoscaling, serviceAccount, networkPolicy).
- Outputs: chart skeleton — `Chart.yaml`, `values.yaml`, `values-dev.yaml`, `values-prod.yaml`, `templates/` (deployment, service, ingress, serviceaccount, hpa, pdb, networkpolicy, secret, configmap, service-monitor, NOTES.txt).
- Rule: `helm template` output must be tracked in CI for review. `helm install --atomic` rolls back on failure. `helm-diff` plugin for upgrade review.

### `/k8s kustomize <overlay>`
Kustomize (overlay-based patching).
- Inputs: base manifests, overlay name, patches.
- Outputs:
  ```
  deploy/
    base/
      kustomization.yaml
      deployment.yaml
      service.yaml
    overlays/
      dev/
        kustomization.yaml     # patches replica count, image tag, ingress host
        patch-deployment.yaml
      prod/
        kustomization.yaml
        patch-deployment.yaml
  ```
- Rule: `kustomize build` output checked in CI for review. `kustomize edit set image` for image bumps. `components/` for reusable patches across overlays.

### `/k8s gitops <app>`
GitOps (Argo CD / Flux).
- Inputs: repo, path, target cluster, sync policy, automated prune / self-heal.
- Outputs:
  ```yaml
  # Argo CD Application
  apiVersion: argoproj.io/v1alpha1
  kind: Application
  metadata: {name: <app>, namespace: argocd}
  spec:
    project: default
    source:
      repoURL: https://github.com/org/app-deploy
      targetRevision: HEAD
      path: overlays/prod
    destination:
      server: https://kubernetes.default.svc
      namespace: <ns>
    syncPolicy:
      automated:
        prune: true
        selfHeal: true
      syncOptions:
      - CreateNamespace=false
      - PrunePropagationPolicy=foreground
      - ServerSideApply=true
      retry:
        limit: 5
        backoff: {duration: 5s, factor: 2, maxDuration: 3m}
  ```
- Rule: GitOps is the only writer. Drift → alert → PR. Use `ServerSideApply` for fewer conflicts. Pin Argo CD to a specific version.

### `/k8s observability <service>`
Observability (metrics + logs + traces).
- Inputs: service, scrape config, log shipping, trace backend.
- Outputs:
  - **Metrics**: `ServiceMonitor` for Prometheus Operator:
    ```yaml
    apiVersion: monitoring.coreos.com/v1
    kind: ServiceMonitor
    metadata: {name: <service>, namespace: <ns>}
    spec:
      selector: {matchLabels: {app.kubernetes.io/name: <service>}}
      endpoints:
      - {port: http, path: /metrics, interval: 30s}
    ```
  - **Logs**: Fluent Bit / Vector daemonset ships stdout/stderr to Loki / Elasticsearch / CloudWatch. App writes structured JSON logs to stdout.
  - **Traces**: OpenTelemetry SDK in app, OTLP exporter to Tempo / Jaeger / X-Ray / Datadog. Trace ID propagated to logs (correlation).
  - **Probes-as-metrics**: blackbox exporter, kube-state-metrics, node-exporter.

### `/k8s troubleshoot <symptom>`
Troubleshoot a workload.
- Inputs: namespace, pod name, symptom (CrashLoopBackOff / ImagePullBackOff / Pending / OOMKilled / not ready / connection refused).
- Outputs: triage tree:
  - **CrashLoopBackOff** → `kubectl logs <pod> --previous`, `kubectl describe pod`, exit code, events. Common: bad config, missing secret, OOM, image entrypoint wrong.
  - **ImagePullBackOff** → image registry auth (`imagePullSecrets`), typo, image doesn't exist for arch.
  - **Pending** → `kubectl describe pod` shows scheduling failures. Common: insufficient CPU/memory (requests too high), node selector no match, PVC not bound, anti-affinity can't be satisfied.
  - **OOMKilled** → `kubectl describe pod` → `Last State: Terminated, Reason: OOMKilled`. Raise `limits.memory` or fix the leak.
  - **Not Ready** → `kubectl describe pod` → `Readiness probe failed: HTTP 500`. Check app logs, dependency health (DB / cache).
  - **Connection refused / timeout** → NetworkPolicy? Service selector mismatch? DNS resolution? `kubectl exec <pod> -- nslookup <svc>`, `kubectl exec <pod> -- curl <svc>:port`.
  - **Drain stuck** → PDB blocking (`kubectl get pdb`), HPA can't scale fast enough. `kubectl cordon` + `kubectl drain --force --ignore-daemonsets --delete-emptydir-data`.
- Rule: `kubectl describe` is the universal first command. `kubectl logs` second. `kubectl exec` third (won't work on distroless images).

### `/k8s upgrade <target_version>`
Cluster + workload upgrade.
- Inputs: target Kubernetes version, current version, tooling (kubeadm / EKS / GKE / AKS upgrade flow).
- Outputs:
  - **Control plane**: one minor version at a time, etcd backup before each upgrade.
  - **Node groups**: rolling upgrade (managed: console / API; kubeadm: `kubectl drain` + replace + uncordon).
  - **Workloads**: `kubectl-convert -f <manifest> --output-version <target>` for removed APIs (extensions/v1beta1 → networking.k8s.io/v1, etc.). Test in staging first.
  - **CRDs**: upgrade CRDs before operator that uses them. Check API deprecation guide.
  - **Image rebuilds**: rebase on new base images (cve-driven).
- Rule: staging first. Read release notes for breaking changes. Backup etcd + PVC snapshots. Always upgrade control plane one minor version at a time.

### `/k8s cost <scope>`
Cost control.
- Inputs: cluster / namespace / workload, time window.
- Outputs:
  - **Right-sizing**: VPA recommendations (`kubectl describe vpa`), `kubectl top pod` for current usage, requests vs actual.
  - **Bin-packing**: requests vs limits — high requests, low limits means wasted capacity on the node.
  - **Spot / preemptible**: non-critical workloads (batch, dev) → spot. Critical → on-demand. Karpenter / Cluster Autoscaler.
  - **Sleep / scale-to-zero**: dev namespaces scale to zero outside work hours (KEDA scaled objects / Argo CD sync windows).
  - **Right-instance**: pick instance type per workload (CPU-bound vs memory-bound → different families).
  - **Showback / chargeback**: label-driven cost allocation via Kubecost / OpenCost / cloud provider cost tools.

### `/k8s multi-cluster <topology>`
Multi-cluster (dev/staging/prod, multi-region, multi-cloud).
- Inputs: cluster count, regions, cloud providers, primary / DR, GitOps strategy.
- Outputs:
  - **GitOps per cluster**: separate Argo CD Applications per cluster (or `cluster:` selector in ApplicationSet).
  - **ApplicationSet**: templated Argo CD apps for fan-out across clusters/regions.
  - **Multi-cluster service mesh**: Istio multi-primary / primary-remote, Linkerd multi-cluster.
  - **Cross-cluster secrets**: External Secrets + cluster-aware SecretStore refs.
  - **Cluster API (CAPI)**: declarative cluster lifecycle management.
  - **Cluster registration**: Hub-spoke with Rancher, Cluster API, or Argo CD multi-cluster.

### `/k8s audit <service_or_cluster>`
Audit an existing Kubernetes deployment. See §6.

### `/k8s deploy <topology>`
Pre-deployment + post-deployment runbook.
- Inputs: target topology, registry, rollout strategy (rolling / canary / blue-green), GitOps flow.
- Outputs:
  - **Pre-deploy**: image scanned clean + signed + SBOM attached, image pulled on cluster (or policy to pull-on-pod-create), manifest tested in staging, canary plan defined.
  - **Deploy**: GitOps sync (Argo CD / Flux), or `kubectl apply` (only in emergencies). Watch rollout: `kubectl rollout status deployment/<name>`. Health: `kubectl get pods -l app=<name>` — confirm new replicas Ready before old ones terminate.
  - **Post-deploy**: smoke test (curl service DNS), SLO burn check, log tail, metrics delta (PromQL for error rate / latency), trace a sample request end-to-end.
- Rule: digest-pinned deployment. Roll forward, never back. If broken, fix forward with a new commit; do not `kubectl rollout undo` blindly.

## 4. Execution Order (Full Kubernetes Service Cycle)

For a new service's Kubernetes artifacts:

1. `/k8s namespace <ns>` → namespace + default-deny + quota + PSS restricted
2. `/docker build <service>` → image built with BuildKit
3. `/docker scan <image>` → Trivy clean at HIGH/CRITICAL
4. `/docker sbom <image>` → SBOM attached
5. `/docker sign <image>` → cosign signed
6. `/docker push <image>` → registry pushed
7. `/k8s serviceaccount <name>` → dedicated SA + IRSA / Workload Identity
8. `/k8s configmap <name>` × N → non-secret config
9. `/k8s secret <name>` × N → secrets via External Secrets / Sealed
10. `/k8s pvc <name>` × N → persistent storage
11. `/k8s deployment <service>` (or statefulset / daemonset / job / cronjob)
12. `/k8s probes <service>` → liveness + readiness + startup
13. `/k8s security-context <service>` → non-root + read-only + cap drop + seccomp
14. `/k8s service <name>` → Service (ClusterIP / Headless)
15. `/k8s networkpolicy <name>` → default-deny + explicit allow (ingress + egress incl. DNS)
16. `/k8s hpa <service>` → autoscaling
17. `/k8s pdb <service>` → disruption budget
18. `/k8s ingress <name>` or `/k8s gateway <name>` → L7 routing + TLS
19. `/k8s observability <service>` → ServiceMonitor + log shipping + traces
20. `/k8s rbac <subject>` × N → least-privilege roles + bindings
21. `/k8s helm <chart>` or `/k8s kustomize <overlay>` → templating layer
22. `/k8s gitops <app>` → Argo CD / Flux Application
23. `/k8s audit <service>` → pre-launch review
24. `/k8s deploy <topology>` → production cutover

> 🛑 **No production rollout without:** image scan clean + signed + SBOM, image pinned by digest, namespace default-deny active, NetworkPolicy explicit allow, ServiceAccount dedicated + IRSA wired, security context non-root + read-only + cap-drop, all three probes set, resources requests+limits, PDB + HPA attached, ServiceMonitor live, GitOps repo sync working.

## 5. Output Location
All artifacts written under the service's deploy tree by default. `deploy/base/`, `deploy/overlays/`, `deploy/charts/`, `argocd/`. Project-level docs in `/<project>/services/<service>/deploy/` or `/<project>/platform/`. Override with `--out=<path>`.

## 6. Audit Workflow
When asked to audit an existing Kubernetes deployment:

1. **Version & topology**: Kubernetes version (1.30+ recommended; 1.28+ for older platforms), node count, control plane HA, cluster autoscaler presence. Cluster is on a supported version (cloud providers typically deprecate after ~16 months).
2. **Image discipline**: every container `image:` references a digest, not a mutable tag. No `:latest`. Run `kubectl get deploy -A -o json | jq -r '.items[].spec.template.spec.containers[].image' | sort -u` and audit.
3. **GitOps discipline**: Argo CD / Flux deployed and in sync. Drift alerts on. `kubectl edit` not used for routine changes (audit via `kubectl events` / git log). Manual changes are flagged.
4. **Resources**: every container has `resources.requests` and `resources.limits` set. `kubectl describe deploy -A | grep -A 5 Requests`. Flag any container without requests — scheduler will pack them onto nodes until OOM.
5. **Probes**: every long-running container has `livenessProbe`, `readinessProbe`, `startupProbe`. Run `kubectl get pods -A -o json | jq '.items[].spec.containers[] | select(.livenessProbe==null)'` (and readiness, startup).
6. **PDB**: every Deployment / StatefulSet has a PDB. `kubectl get pdb -A`. Missing = voluntary disruptions can take out the workload.
7. **HPA / VPA**: stateless workloads have HPA. Stateful / leader-elected have explicit capacity plan. No HPA + VPA on same metric.
8. **Security context**: `runAsNonRoot: true` everywhere. `allowPrivilegeEscalation: false`. `readOnlyRootFilesystem: true`. `capabilities.drop: ["ALL"]`. `seccompProfile.type: RuntimeDefault`. Run `kubectl get pods -A -o json | jq` filter chain.
9. **ServiceAccount**: no workload uses `default`. `automountServiceAccountToken: false` unless API access needed. IRSA / Workload Identity annotation when cloud access required.
10. **NetworkPolicy**: every namespace has default-deny. Workloads have explicit allow rules. DNS egress rule present. Run `kubectl get networkpolicy -A` — empty result is a red flag.
11. **Namespaces**: PSS `restricted` enforced (or planned). ResourceQuotas on every namespace. No workloads in `default`.
12. **RBAC**: least-privilege. No `cluster-admin` for apps. No wildcard verbs / resources. `kubectl auth can-i --list -n <ns> --as=system:serviceaccount:<ns>:<sa>` for every workload SA.
13. **ConfigMap / Secret hygiene**: no plaintext secrets in ConfigMap. Secret encrypted at rest (`etcd` encryption / KMS). External Secrets for production-grade secret sourcing.
14. **Ingress / Gateway**: TLS always. Host-based routing. Cert-manager or equivalent for cert lifecycle. No HTTP-only Ingress in prod.
15. **Persistence**: StatefulSets have headless Service + PVC per pod. PVCs in a StorageClass with snapshot policy. Volume snapshots backed up.
16. **Observability**: ServiceMonitor for Prometheus scrape (or OpenTelemetry collector scrape). Logs shipped via DaemonSet (Fluent Bit / Vector). Traces via OTel SDK. Cluster metrics via kube-state-metrics + node-exporter.
17. **Helm / Kustomize hygiene**: `helm template` / `kustomize build` output checked in CI. No drift between chart and deployed manifest. No hand-patched manifests outside the templating system.
18. **Cluster upgrades**: target version tracked. Workloads tested against new APIs. Removed APIs replaced (`kubectl-convert`). CRDs upgraded before controllers.
19. **Cost**: requests close to actual usage (VPA recommendations reviewed). Spot for non-critical. Idle dev clusters scaled to zero. Right-sized node pools per workload class.
20. **Multi-cluster / DR**: backup etcd (or managed snapshot). PVC snapshots / cross-region replication. Runbooks for cluster loss / region loss.

Output: a report with `Aligned` components and `Violation` instances, each tagged with severity (`P0` blocks launch / `P1` must-fix this quarter / `P2` nice-to-have), a concrete fix, and an effort estimate.

## 7. Hard Rules
- **Never** ship a container with `:latest` in any prod spec. Digest-pinned.
- **Never** ship a workload without `resources.requests` and `resources.limits`. Scheduler will misbehave.
- **Never** ship a long-running container without all three probes. Restart loops and silent failures are worse than fast failures.
- **Never** ship a Deployment / StatefulSet without a PDB. Voluntary disruptions can take out the workload.
- **Never** run a workload in the `default` namespace. Use a dedicated namespace with default-deny NetworkPolicy.
- **Never** use the `default` ServiceAccount for app workloads. Dedicated SA per workload.
- **Never** run containers as root. `runAsNonRoot: true`, numeric UID > 0, `allowPrivilegeEscalation: false`.
- **Never** ship a workload with `readOnlyRootFilesystem: false` without an explicit justification. Read-only + tmpfs for writable dirs.
- **Never** ship a workload with `capabilities.drop` unset. Drop ALL, add back only what's needed.
- **Never** ship a workload in a namespace without default-deny NetworkPolicy. Explicit allow lists only.
- **Never** ship a workload without explicit DNS egress rule (to kube-dns). App will silently fail name resolution.
- **Never** `kubectl edit` in production. Git is the source of truth; Argo CD / Flux is the only writer.
- **Never** combine HPA + VPA on the same metric. Pick one. (HPA on CPU/memory + VPA in `Off` mode for recommendations is OK.)
- **Never** put secrets in plaintext ConfigMap or commit raw `Secret` YAML to Git.
- **Never** use `kubectl apply` for routine changes. GitOps sync only.
- **Never** `kubectl rollout undo` blindly. Fix forward with a new commit.
- **Always** set `resources.requests` AND `resources.limits` on every container.
- **Always** set `livenessProbe`, `readinessProbe`, `startupProbe` on every long-running container.
- **Always** set `runAsNonRoot: true` and numeric `runAsUser` > 0 in pod + container securityContext.
- **Always** `capabilities.drop: ["ALL"]` and add only what's needed.
- **Always** `seccompProfile.type: RuntimeDefault` (or a custom profile).
- **Always** a PDB on every Deployment / StatefulSet with replicas > 1.
- **Always** a NetworkPolicy default-deny per namespace + explicit allow per workload.
- **Always** a dedicated ServiceAccount per workload + `automountServiceAccountToken: false` unless API access needed.
- **Always** GitOps-driven changes (Argo CD / Flux). Drift = alert = PR.
- **Always** image pinned by digest (`@sha256:...`) for any deployment that targets prod.
- **Always** healthchecks as `httpGet` (or `tcpSocket` / `gRPC`) AND liveness ≠ readiness in semantics.
- **Always** read the cluster upgrade release notes before applying — breaking API removals, CRD incompatibilities, deprecated flags.
- **Always** test workload manifests against target cluster version in staging before prod.

---

# Reference — Deployment Patterns

## Rollout strategies

| Strategy | Implementation | Trade-off |
|---|---|---|
| RollingUpdate (default) | `spec.strategy.rollingUpdate.{maxSurge, maxUnavailable}` | Zero-downtime; slow; old + new coexist briefly. |
| Recreate | `spec.strategy.type: Recreate` | Downtime during rollout. Use for stateful with strict versioning. |
| Blue/Green | Two Deployments + Service label switch | Instant cutover; instant rollback; 2× resource cost. |
| Canary | Two Deployments + traffic split (Istio / Linkerd / Nginx annotations) | Progressive rollout by %; complex; needs mesh or ingress canary. |
| A/B | Same as canary but on user attribute (cookie / header) | Targeted experiments; complex. |

For most workloads: RollingUpdate with `maxSurge: 25%, maxUnavailable: 0`. Canary with mesh for high-stakes rollouts.

## Init containers

```yaml
spec:
  initContainers:
  - name: wait-for-db
    image: registry.example.com/app/wait-for-db:1.0.0
    command: ['sh', '-c', 'until nc -z db 5432; do echo waiting; sleep 2; done']
  - name: migrate
    image: registry.example.com/app/migrator:1.0.0
    command: ['alembic', 'upgrade', 'head']
  containers:
  - name: app
    # ...
```

Init containers run sequentially, must succeed before app starts. Common uses: wait for dependencies, run migrations, pull secrets, set up cache.

## Sidecar containers (logging, proxy, agent)

```yaml
spec:
  containers:
  - name: app
    image: registry.example.com/app/service@sha256:<digest>
  - name: otel-collector    # sidecar
    image: otel/opentelemetry-collector-contrib:0.96.0
    args: ["--config=/conf/collector.yaml"]
    volumeMounts:
    - {name: otel-conf, mountPath: /conf}
  volumes:
  - {name: otel-conf, configMap: {name: otel-conf}}
```

Native sidecar (KEP-753, GA in 1.29+) — `restartPolicy: Always` for true sidecar lifecycle (started before main, terminated after).

## Topology spread + anti-affinity

```yaml
spec:
  affinity:
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
      - topologyKey: kubernetes.io/hostname
        labelSelector: {matchLabels: {app.kubernetes.io/name: <service>}}
  topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: ScheduleAnyway
    labelSelector: {matchLabels: {app.kubernetes.io/name: <service>}}
```

`requiredDuringScheduling` for hard guarantee (can fail to schedule). `preferred...` for best-effort. Topology spread distributes across zones.

## Pod disruption budget + priority

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata: {name: high-priority}
value: 1000000
globalDefault: false
description: "Critical workloads, evicted last"
```

Combined with PDB:
```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata: {name: <service>, namespace: <ns>}
spec:
  minAvailable: 2
  selector: {matchLabels: {app.kubernetes.io/name: <service>}}
```

---

# Reference — Networking

## Service types

| Type | Use | Reachability |
|---|---|---|
| ClusterIP | Default. Internal-only. | Cluster-internal DNS (`<svc>.<ns>.svc.cluster.local`). |
| NodePort | Exposed on every node's IP at port 30000-32767. | `<node-ip>:<nodeport>`. Used by Ingress controllers for backend. |
| LoadBalancer | Cloud L4 LB. | Public (or private) LB DNS. |
| ExternalName | CNAME to external. | DNS-level redirect. |

## Ingress vs Gateway API

| | Ingress | Gateway API |
|---|---|---|
| Status | GA, widely supported | GA in 1.24+, growing adoption |
| L7 protocols | HTTP, HTTPS | HTTP, HTTPS, gRPC, TLS, TCP |
| Multi-tenancy | Via annotations / namespaces | First-class (GatewayClass, listener) |
| Multi-routing | Single Ingress, multiple rules | Gateway + HTTPRoute / GRPCRoute / TCPRoute |
| Cross-namespace | Limited | First-class via `parentRefs` |

Use Gateway API for new clusters unless tooling requires Ingress.

## NetworkPolicy patterns

### Default deny

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: {name: default-deny, namespace: <ns>}
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]
```

### App talking to DB (in another namespace)

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: {name: <app>, namespace: <ns>}
spec:
  podSelector: {matchLabels: {app.kubernetes.io/name: <app>}}
  policyTypes: [Ingress, Egress]
  ingress:
  - from:
    - namespaceSelector: {matchLabels: {kubernetes.io/metadata.name: ingress-nginx}}
    ports: [{protocol: TCP, port: 8080}]
  egress:
  - to: [{namespaceSelector: {matchLabels: {kubernetes.io/metadata.name: kube-system}}}]
    ports: [{protocol: UDP, port: 53}, {protocol: TCP, port: 53}]
  - to: [{namespaceSelector: {matchLabels: {kubernetes.io/metadata.name: db}}}]
    ports: [{protocol: TCP, port: 5432}]
```

---

# Reference — Autoscaling

## HPA + Cluster Autoscaler

HPA scales pods based on metrics. Cluster Autoscaler / Karpenter adds nodes when pods can't schedule. Together:

```
HPA sees CPU > 70% → request 5 more pods
Pods Pending (no node capacity) → CA / Karpenter adds node
Pods schedule, load drops, HPA scales down
```

## Karpenter (recommended over CA on AWS)

```yaml
apiVersion: karpenter.sh/v1beta1
kind: NodePool
metadata: {name: default}
spec:
  template:
    spec:
      requirements:
      - key: kubernetes.io/arch
        operator: In
        values: [amd64, arm64]
      - key: karpenter.sh/capacity-type
        operator: In
        values: [spot, on-demand]
      - key: karpenter.k8s.aws/instance-category
        operator: In
        values: [c, m, r]
      - key: karpenter.k8s.aws/instance-generation
        operator: Gt
        values: ["4"]
      nodeClassRef:
        name: default
  limits:
    cpu: "1000"
    memory: 4000Gi
  disruption:
    consolidationPolicy: WhenUnderutilized
    expireAfter: 720h
```

Karpenter: faster bin-packing, spot-aware, instance-type flexibility.

## KEDA (event-driven autoscaling)

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata: {name: <service>, namespace: <ns>}
spec:
  scaleTargetRef:
    name: <deployment>
  minReplicaCount: 0
  maxReplicaCount: 100
  triggers:
  - type: prometheus
    metadata:
      serverAddress: http://prometheus.monitoring.svc:9090
      metricName: http_requests_per_second
      threshold: "1000"
      query: sum(rate(http_requests_total{service="<service>"}[2m]))
```

Scale-to-zero for dev. Scale on Kafka lag, SQS depth, RabbitMQ queue length, cron schedule.

---

# Reference — Observability

## Three pillars in one stack

| Pillar | Tool | Notes |
|---|---|---|
| Metrics | Prometheus + Grafana | Pull-based scrape. PromQL for queries. Alertmanager for alerts. |
| Logs | Loki + Promtail (or EFK) | Label-based indexing. Cheaper than ES for low-cardinality logs. |
| Traces | Tempo / Jaeger / X-Ray | OpenTelemetry SDK in app. Trace ID propagated to logs. |

## ServiceMonitor (Prometheus Operator)

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata: {name: <service>, namespace: <ns>}
spec:
  selector: {matchLabels: {app.kubernetes.io/name: <service>}}
  namespaceSelector: {matchNames: [<ns>]}
  endpoints:
  - {port: http, path: /metrics, interval: 30s}
```

## PodMonitor (scrape by pod)

For headless services or when service discovery by label is hard:
```yaml
apiVersion: monitoring.coreos.com/v1
kind: PodMonitor
metadata: {name: <service>, namespace: <ns>}
spec:
  selector: {matchLabels: {app.kubernetes.io/name: <service>}}
  podMetricsEndpoints:
  - {port: http, path: /metrics, interval: 30s}
```

## Log shipping (Fluent Bit)

DaemonSet in `logging` namespace:
```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata: {name: fluent-bit, namespace: logging}
spec:
  selector: {matchLabels: {app.kubernetes.io/name: fluent-bit}}
  template:
    spec:
      serviceAccountName: fluent-bit
      containers:
      - name: fluent-bit
        image: fluent/fluent-bit:2.2
        volumeMounts:
        - {name: varlog, mountPath: /var/log}
        - {name: varlibdockercontainers, mountPath: /var/lib/docker/containers, readOnly: true}
        - {name: fluentbit-config, mountPath: /fluent-bit/etc}
      volumes:
      - {name: varlog, hostPath: {path: /var/log}}
      - {name: varlibdockercontainers, hostPath: {path: /var/lib/docker/containers}}
      - {name: fluentbit-config, configMap: {name: fluent-bit-config}}
```

App writes structured JSON to stdout → Fluent Bit tail-reads container logs → ships to Loki / ES / CloudWatch.

## Alerting (PrometheusRule)

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata: {name: <service>, namespace: <ns>}
spec:
  groups:
  - name: <service>.alerts
    rules:
  - alert: HighErrorRate
    expr: |
      sum(rate(http_requests_total{service="<service>",status=~"5.."}[5m]))
        / sum(rate(http_requests_total{service="<service>"}[5m])) > 0.05
    for: 5m
    labels: {severity: critical}
    annotations:
      summary: "High 5xx rate on <service>"
      description: "Error rate {{ $value | humanizePercentage }} for 5m."
```

---

# Reference — Helm + Kustomize + GitOps

## Helm chart skeleton

```
charts/<service>/
  Chart.yaml
  values.yaml
  values-dev.yaml
  values-prod.yaml
  templates/
    deployment.yaml
    service.yaml
    ingress.yaml
    serviceaccount.yaml
    hpa.yaml
    pdb.yaml
    networkpolicy.yaml
    configmap.yaml
    secret.yaml
    service-monitor.yaml
    _helpers.tpl
    NOTES.txt
```

`helm template charts/<service> --values values-prod.yaml > rendered.yaml` checked in CI for review. Diff with previous render — that's the deploy diff.

## Kustomize overlay

```
deploy/
  base/
    kustomization.yaml
    namespace.yaml
    deployment.yaml
    service.yaml
  overlays/
    dev/
      kustomization.yaml
      patch-replicas.yaml
    prod/
      kustomization.yaml
      patch-replicas.yaml
      patch-resources.yaml
```

`base/kustomization.yaml`:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- namespace.yaml
- deployment.yaml
- service.yaml
- networkpolicy.yaml
- pdb.yaml
- hpa.yaml
commonLabels:
  app.kubernetes.io/name: <service>
images:
- name: <service>
  newName: registry.example.com/app/service
  newTag: 1.4.2    # overridden per overlay or via CI
```

`overlays/prod/kustomization.yaml`:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: <ns>-prod
resources:
- ../../base
namePrefix: prod-
patches:
- path: patch-resources.yaml
images:
- name: <service>
  newTag: 1.4.2
```

`kustomize build overlays/prod` checked in CI for review.

## Argo CD ApplicationSet (multi-cluster)

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata: {name: <service>, namespace: argocd}
spec:
  generators:
  - list:
      elements:
      - cluster: prod-us-east
        url: https://prod-us-east.eks.example.com
        namespace: <ns>-prod
      - cluster: prod-eu-west
        url: https://prod-eu-west.eks.example.com
        namespace: <ns>-prod
  template:
    metadata: {name: '{{cluster}}-<service>'}
    spec:
      project: default
      source:
        repoURL: https://github.com/org/app-deploy
        targetRevision: HEAD
        path: overlays/prod
      destination:
        server: '{{url}}'
        namespace: '{{namespace}}'
      syncPolicy:
        automated: {prune: true, selfHeal: true}
```

---

# Reference — Troubleshooting

## Universal first commands

```bash
# What's wrong?
kubectl describe pod -n <ns> <pod>
kubectl logs -n <ns> <pod> --previous
kubectl get events -n <ns> --sort-by=.lastTimestamp

# Network?
kubectl exec -n <ns> <pod> -- nslookup <svc>
kubectl exec -n <ns> <pod> -- curl -v <svc>:<port>/health

# Resources?
kubectl top pod -n <ns> <pod>
kubectl describe node | grep -A 5 "Allocated resources"

# Cluster events?
kubectl get events -A --sort-by=.lastTimestamp | tail -50

# Argo CD sync status?
argocd app list
argocd app get <app>
argocd app diff <app>
```

## Symptom triage

| Symptom | First check | Common fix |
|---|---|---|
| CrashLoopBackOff | `kubectl logs --previous`, exit code | Fix config / secret / DB / OOM |
| ImagePullBackOff | `kubectl describe pod` events | `imagePullSecrets`, fix image name |
| Pending | `kubectl describe pod` events | Raise node capacity, fix node selector, fix PVC |
| OOMKilled | `kubectl describe pod` | Raise `limits.memory` or fix leak |
| Not Ready | `kubectl describe pod` + logs | App-side dependency down (DB / cache / external) |
| Connection refused | `kubectl get svc`, `nslookup` | NetworkPolicy, service selector mismatch |
| Drain stuck | `kubectl get pdb` | PDB blocking; raise `minAvailable` slack or add nodes |
| HPA not scaling | `kubectl describe hpa` | Check metrics-server, Prom Adapter, requests set |
| Argo CD OutOfSync | `argocd app diff <app>` | Git vs cluster drift; PR or sync |
| DNS not resolving | `kubectl exec ... nslookup kubernetes.default` | CoreDNS down; NetworkPolicy missing DNS egress |
| TLS error from Ingress | `kubectl describe ingress`, `kubectl logs -n ingress-nginx` | Cert-manager / cert expired / wrong secret |
| etcd backup fails | `etcdctl snapshot save` exit code | Disk full, perms, ETCDCTL_API=3 |

## Drain / cordon

```bash
# Drain for upgrade / maintenance
kubectl cordon <node>
kubectl drain <node> --ignore-daemonsets --delete-emptydir-data --force

# Bring back
kubectl uncordon <node>
```

## Cluster debugging

```bash
# Component health
kubectl get componentstatuses   # deprecated on managed, use --no-headers on self-managed
kubectl get --raw='/healthz?verbose'

# etcd
kubectl -n kube-system exec etcd-<node> -- etcdctl endpoint status --cluster -w table

# DNS
kubectl -n kube-system logs -l k8s-app=kube-dns

# CNI
kubectl get pods -n kube-system -l k8s-app=calico-node   # or your CNI
```

## Quick triage

| Symptom | First check |
|---|---|
| Pod won't start | `kubectl describe pod` events + `kubectl logs --previous` |
| Pod Pending | `kubectl describe pod` — scheduling failures |
| Service unreachable | `kubectl get endpoints <svc>` — pods selected? `kubectl get svc` |
| Ingress 502 | `kubectl logs -n ingress-nginx` — backend pods healthy? |
| DNS broken | `kubectl exec ... nslookup kubernetes.default` |
| HPA at max but still slow | `kubectl describe hpa` — metrics-server working? `kubectl top pod` |
| Cluster autoscaler not adding nodes | Check CA logs in `kube-system`; pod requirements fit any instance type? |
| Argo CD `OutOfSync` | `argocd app diff <app>` — drift, sync policy disabled, prereqs missing |
| PVC Pending | `kubectl get pv`, `kubectl describe pvc` — provisioner / storage class issue |
| Cert expired | `kubectl describe certificate`, `kubectl get events -n cert-manager` |