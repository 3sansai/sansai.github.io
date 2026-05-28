---
title: Kubernetes（K8s）入门与实战：容器编排核心知识
date: 2026-05-28 01:00:00
tags:
  - Kubernetes
  - K8s
  - 容器编排
  - DevOps
categories:
  - 技术
---

## 一、Kubernetes 概述

Kubernetes（简称 K8s）是 Google 开源的容器编排平台，用于自动化部署、扩展和管理容器化应用。它已成为云原生领域的事实标准。

### 为什么需要 K8s

Docker 解决了单机容器化问题，但在生产环境中还需要：

- **多机调度**：容器分布在多台服务器上
- **自动扩缩**：根据负载自动调整实例数
- **服务发现**：容器间如何互相找到
- **滚动更新**：零停机部署
- **故障恢复**：容器挂了自动重启
- **配置管理**：统一管理配置和密钥

### K8s 架构

```
Master 节点（控制平面）
├── API Server        # 所有操作的入口
├── etcd              # 分布式键值存储（集群状态）
├── Scheduler         # 决定 Pod 运行在哪个节点
└── Controller Manager # 维护期望状态

Worker 节点（工作节点）
├── kubelet           # 节点代理，管理 Pod
├── kube-proxy        # 网络代理，实现 Service
└── Container Runtime # 容器运行时（containerd/CRI-O）
```

---

## 二、核心概念

### Pod

Pod 是 K8s 的最小调度单位，一个 Pod 可以包含一个或多个容器。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
  labels:
    app: my-app
spec:
  containers:
    - name: app
      image: my-app:1.0
      ports:
        - containerPort: 8080
      resources:
        requests:
          memory: "256Mi"
          cpu: "250m"
        limits:
          memory: "512Mi"
          cpu: "500m"
```

### 常用资源对象

| 资源 | 说明 |
|---|---|
| Pod | 最小调度单位 |
| Deployment | 无状态应用部署（推荐） |
| StatefulSet | 有状态应用部署（如数据库） |
| DaemonSet | 每个节点运行一个 Pod |
| Job / CronJob | 一次性/定时任务 |
| Service | 服务发现与负载均衡 |
| Ingress | HTTP/HTTPS 路由 |
| ConfigMap | 配置管理 |
| Secret | 敏感信息管理 |
| PV / PVC | 持久化存储 |
| Namespace | 资源隔离 |

---

## 三、Deployment

Deployment 是最常用的部署方式，管理 Pod 的副本数、更新策略等。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: default
spec:
  replicas: 3                    # 副本数
  selector:
    matchLabels:
      app: my-app
  strategy:
    type: RollingUpdate          # 滚动更新
    rollingUpdate:
      maxSurge: 1                # 最多多出1个 Pod
      maxUnavailable: 0          # 不允许不可用
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: app
          image: my-app:1.0
          ports:
            - containerPort: 8080
          env:
            - name: SPRING_PROFILES_ACTIVE
              value: "prod"
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: password
          resources:
            requests:
              cpu: "250m"
              memory: "256Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          livenessProbe:          # 存活探针
            httpGet:
              path: /actuator/health/liveness
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:         # 就绪探针
            httpGet:
              path: /actuator/health/readiness
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 5
```

### 常用命令

```bash
# 创建/更新
kubectl apply -f deployment.yaml

# 查看
kubectl get deployments
kubectl get pods
kubectl get pods -o wide          # 详细信息
kubectl get all                   # 所有资源

# 扩缩容
kubectl scale deployment my-app --replicas=5

# 滚动更新
kubectl set image deployment/my-app app=my-app:2.0

# 回滚
kubectl rollout undo deployment/my-app
kubectl rollout history deployment/my-app

# 查看状态
kubectl rollout status deployment/my-app

# 删除
kubectl delete deployment my-app
```

---

## 四、Service

Service 为 Pod 提供稳定的网络访问入口。

### Service 类型

| 类型 | 说明 | 适用场景 |
|---|---|---|
| ClusterIP | 集群内部 IP（默认） | 内部服务通信 |
| NodePort | 在每个节点上开放端口 | 开发测试 |
| LoadBalancer | 云厂商负载均衡 | 生产环境 |
| ExternalName | 映射到外部域名 | 访问外部服务 |

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app-svc
spec:
  type: ClusterIP
  selector:
    app: my-app                  # 匹配 Pod 标签
  ports:
    - port: 80                   # Service 端口
      targetPort: 8080           # Pod 端口
      protocol: TCP
```

### Headless Service（StatefulSet 用）

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-db-headless
spec:
  clusterIP: None                # 无 ClusterIP
  selector:
    app: my-db
  ports:
    - port: 3306
```

---

## 五、Ingress

Ingress 提供 HTTP/HTTPS 路由，类似 Nginx 反向代理。

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - blog.3sansai.fun
      secretName: tls-secret
  rules:
    - host: blog.3sansai.fun
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api-svc
                port:
                  number: 80
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-svc
                port:
                  number: 80
```

---

## 六、配置管理

### ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  application.yml: |
    server:
      port: 8080
    spring:
      profiles:
        active: prod
  DB_HOST: "mysql-svc"
  DB_PORT: "3306"
```

### Secret

```bash
# 创建 Secret
kubectl create secret generic db-secret \
  --from-literal=password=my-secret-password

# 或 YAML（值需 base64 编码）
echo -n 'my-secret-password' | base64
```

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-secret
type: Opaque
data:
  password: bXktc2VjcmV0LXBhc3N3b3Jk
```

### 在 Pod 中使用

```yaml
spec:
  containers:
    - name: app
      env:
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: password
      volumeMounts:
        - name: config-volume
          mountPath: /app/config
  volumes:
    - name: config-volume
      configMap:
        name: app-config
```

---

## 七、持久化存储

### PV 和 PVC

```yaml
# PersistentVolume（管理员创建）
apiVersion: v1
kind: PersistentVolume
metadata:
  name: mysql-pv
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce
  storageClassName: standard
  hostPath:
    path: /data/mysql

---
# PersistentVolumeClaim（用户申请）
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mysql-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: standard
```

### StatefulSet 部署数据库

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
spec:
  serviceName: mysql-headless
  replicas: 3
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
        - name: mysql
          image: mysql:8.0
          ports:
            - containerPort: 3306
          env:
            - name: MYSQL_ROOT_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: mysql-secret
                  key: password
          volumeMounts:
            - name: mysql-data
              mountPath: /var/lib/mysql
  volumeClaimTemplates:
    - metadata:
        name: mysql-data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 10Gi
```

---

## 八、自动扩缩容

### HPA（水平 Pod 自动扩缩）

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

```bash
# 查看 HPA 状态
kubectl get hpa
kubectl describe hpa my-app-hpa
```

---

## 九、RBAC 权限管理

```yaml
# Role（命名空间级别）
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: dev
  name: pod-reader
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "watch"]

---
# RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: dev
subjects:
  - kind: User
    name: dev-user
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

---

## 十、Helm 包管理

Helm 是 K8s 的包管理器，类似 Linux 的 apt/yum。

```bash
# 安装 Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# 添加仓库
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# 搜索
helm search repo nginx

# 安装
helm install my-nginx bitnami/nginx

# 查看
helm list

# 升级
helm upgrade my-nginx bitnami/nginx --set replicaCount=3

# 卸载
helm uninstall my-nginx
```

### 自定义 Chart

```
my-chart/
├── Chart.yaml          # Chart 元信息
├── values.yaml         # 默认配置值
├── templates/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   └── _helpers.tpl
└── charts/             # 依赖的子 Chart
```

---

## 十一、故障排查

```bash
# 查看事件
kubectl get events --sort-by='.lastTimestamp'

# Pod 状态异常
kubectl describe pod my-pod
kubectl logs my-pod
kubectl logs my-pod --previous    # 上一个容器的日志
kubectl exec -it my-pod -- /bin/bash  # 进入容器

# 服务无法访问
kubectl get svc
kubectl get endpoints             # 检查是否有后端 Pod
kubectl run test --rm -it --image=curlimages/curl -- curl http://my-svc

# 节点问题
kubectl get nodes
kubectl describe node node-name
kubectl top nodes                 # 资源使用
kubectl top pods                  # Pod 资源使用
```

---

## 十二、部署流程示例

一个完整的 Java 应用部署流程：

```bash
# 1. 构建镜像
docker build -t my-app:1.0 .
docker push my-app:1.0

# 2. 创建命名空间
kubectl create namespace prod

# 3. 创建 Secret
kubectl create secret generic app-secret \
  --from-literal=db-password=xxx \
  -n prod

# 4. 部署应用
kubectl apply -f k8s/deployment.yaml -n prod
kubectl apply -f k8s/service.yaml -n prod
kubectl apply -f k8s/ingress.yaml -n prod

# 5. 验证
kubectl get pods -n prod
kubectl rollout status deployment/my-app -n prod

# 6. 更新版本
kubectl set image deployment/my-app app=my-app:2.0 -n prod
kubectl rollout status deployment/my-app -n prod

# 7. 回滚（如果出问题）
kubectl rollout undo deployment/my-app -n prod
```

---

## 总结

Kubernetes 是容器编排的标准平台。核心要掌握 Pod、Deployment、Service、Ingress 四大对象，理解声明式 API 和期望状态模型。建议先在本地用 minikube 或 kind 搭建练习环境，熟悉基本操作后再接触生产集群。配合 Helm 包管理器，可以大幅简化复杂应用的部署。
