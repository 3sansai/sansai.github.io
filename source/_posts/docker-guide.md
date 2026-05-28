---
title: Docker 容器技术实战：从基础到编排
date: 2026-05-26
tags:
  - Docker
  - 容器
  - DevOps
categories:
  - 技术
---

## 一、Docker 概述

Docker 是一个开源的应用容器引擎，让开发者可以将应用及其依赖打包到一个轻量级、可移植的容器中，然后发布到任何 Linux 或 Windows 机器上。

### 容器 vs 虚拟机

| 特性 | 容器 | 虚拟机 |
|---|---|---|
| 启动速度 | 秒级 | 分钟级 |
| 资源占用 | MB 级 | GB 级 |
| 隔离级别 | 进程级 | 系统级 |
| 镜像大小 | 小（共享内核） | 大（完整 OS） |
| 运行密度 | 数百个容器 | 数十个 VM |

### 核心概念

```
镜像（Image）     → 类模板，只读的文件系统叠加层
容器（Container） → 镜像的运行实例
仓库（Registry）  → 存储和分发镜像的服务（如 Docker Hub）
Dockerfile        → 构建镜像的脚本
```

---

## 二、安装与配置

### Ubuntu 安装

```bash
# 卸载旧版本
sudo apt remove docker docker-engine docker.io containerd runc

# 安装依赖
sudo apt update
sudo apt install ca-certificates curl gnupg

# 添加 Docker 官方 GPG 密钥
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 添加仓库
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 免 sudo 使用
sudo usermod -aG docker $USER
```

### 镜像加速

```json
// /etc/docker/daemon.json
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "https://registry.docker-cn.com"
  ]
}
```

```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
```

---

## 三、镜像操作

```bash
# 搜索镜像
docker search nginx

# 拉取镜像
docker pull nginx:1.24
docker pull mysql:8.0

# 查看本地镜像
docker images

# 删除镜像
docker rmi nginx:1.24

# 删除所有未使用镜像
docker image prune -a

# 导出/导入镜像
docker save -o nginx.tar nginx:1.24
docker load -i nginx.tar

# 构建镜像
docker build -t my-app:1.0 .
docker build -t my-app:1.0 -f Dockerfile.prod .
```

---

## 四、容器操作

### 基础命令

```bash
# 运行容器
docker run -d --name my-nginx -p 80:80 nginx:1.24

# 参数说明
# -d          后台运行
# --name      容器名称
# -p          端口映射（主机:容器）
# -v          数据卷挂载
# -e          环境变量
# --restart   重启策略（always/unless-stopped/on-failure）
# -it         交互式终端
# --rm        退出后自动删除

# 查看运行中的容器
docker ps

# 查看所有容器（包括已停止）
docker ps -a

# 进入容器
docker exec -it my-nginx /bin/bash
docker exec -it my-nginx sh

# 查看日志
docker logs my-nginx
docker logs -f my-nginx          # 实时追踪
docker logs --tail 100 my-nginx  # 最后100行

# 停止/启动/重启
docker stop my-nginx
docker start my-nginx
docker restart my-nginx

# 删除容器
docker rm my-nginx
docker rm -f my-nginx  # 强制删除运行中的容器

# 删除所有已停止容器
docker container prune
```

### 数据卷

```bash
# 创建数据卷
docker volume create my-data

# 查看数据卷
docker volume ls

# 使用数据卷
docker run -d -v my-data:/var/lib/mysql mysql:8.0

# 绑定挂载（主机目录）
docker run -d -v /host/path:/container/path nginx:1.24

# 只读挂载
docker run -d -v /host/config:/config:ro nginx:1.24

# 删除数据卷
docker volume rm my-data
docker volume prune  # 删除未使用的
```

### 网络

```bash
# 创建网络
docker network create my-net

# 查看网络
docker network ls

# 将容器加入网络
docker run -d --name app --network my-net my-app:1.0

# 容器间通过容器名通信
docker run -d --name db --network my-net mysql:8.0
docker run -d --name app --network my-net my-app:1.0
# app 容器中可以直接用 "db" 作为主机名访问数据库

# 删除网络
docker network rm my-net
```

---

## 五、Dockerfile 编写

### 基本语法

```dockerfile
# 基础镜像
FROM eclipse-temurin:17-jre-alpine

# 维护者信息
LABEL maintainer="dev@example.com"

# 设置工作目录
WORKDIR /app

# 复制文件
COPY target/app.jar app.jar

# 设置环境变量
ENV JAVA_OPTS="-Xms512m -Xmx1024m"

# 暴露端口
EXPOSE 8080

# 启动命令
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

### 常用指令

| 指令 | 说明 |
|---|---|
| `FROM` | 基础镜像 |
| `WORKDIR` | 工作目录 |
| `COPY` | 复制文件到镜像 |
| `ADD` | 复制文件（支持 URL 和自动解压） |
| `RUN` | 构建时执行命令 |
| `CMD` | 容器启动时的默认命令（可被覆盖） |
| `ENTRYPOINT` | 容器启动命令（不会被覆盖） |
| `ENV` | 环境变量 |
| `ARG` | 构建参数 |
| `EXPOSE` | 声明端口 |
| `VOLUME` | 声明数据卷挂载点 |

### 多阶段构建

```dockerfile
# 阶段1：构建
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# 阶段2：运行（只保留产物，镜像更小）
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 最佳实践

```dockerfile
# 1. 使用具体版本标签，不用 latest
FROM node:20-alpine

# 2. 合并 RUN 指令减少层数
RUN apk add --no-cache git curl \
    && npm install \
    && npm cache clean --force

# 3. 利用 .dockerignore
# .git
# node_modules
# target
# *.log

# 4. 先 COPY 依赖文件，利用缓存
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# 5. 使用非 root 用户运行
RUN addgroup -S app && adduser -S app -G app
USER app
```

---

## 六、Docker Compose

### docker-compose.yml

```yaml
version: '3.8'

services:
  # 应用服务
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_NAME=mydb
      - DB_PASSWORD=secret
    depends_on:
      mysql:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - app-net

  # 数据库
  mysql:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: secret
      MYSQL_DATABASE: mydb
    volumes:
      - mysql-data:/var/lib/mysql
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - app-net

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped
    networks:
      - app-net

  # Nginx 反向代理
  nginx:
    image: nginx:1.24-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - app-net

volumes:
  mysql-data:
  redis-data:

networks:
  app-net:
    driver: bridge
```

### 常用命令

```bash
# 启动所有服务
docker compose up -d

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f app

# 停止所有服务
docker compose down

# 停止并删除数据卷
docker compose down -v

# 重新构建并启动
docker compose up -d --build

# 扩展服务实例
docker compose up -d --scale app=3
```

---

## 七、常用服务部署

### MySQL

```bash
docker run -d \
  --name mysql \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=secret \
  -e MYSQL_DATABASE=mydb \
  -v mysql-data:/var/lib/mysql \
  mysql:8.0 \
  --character-set-server=utf8mb4 \
  --collation-server=utf8mb4_unicode_ci
```

### Redis

```bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  -v redis-data:/data \
  redis:7-alpine \
  redis-server --appendonly yes --requirepass mypassword
```

### Nginx

```bash
docker run -d \
  --name nginx \
  -p 80:80 \
  -p 443:443 \
  -v ./nginx.conf:/etc/nginx/nginx.conf:ro \
  -v ./html:/usr/share/nginx/html:ro \
  nginx:1.24-alpine
```

### PostgreSQL

```bash
docker run -d \
  --name postgres \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=mydb \
  -v pg-data:/var/lib/postgresql/data \
  postgres:16-alpine
```

---

## 八、生产实践

### 镜像安全

```bash
# 扫描镜像漏洞
docker scout cves nginx:1.24

# 使用最小基础镜像
FROM alpine:3.19        # ~5MB
FROM scratch            # 空镜像（适合 Go 等静态编译语言）

# 只读文件系统
docker run --read-only --tmpfs /tmp my-app:1.0
```

### 资源限制

```bash
# 限制内存
docker run -m 512m my-app:1.0

# 限制 CPU
docker run --cpus=1.5 my-app:1.0

# Docker Compose 中
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1.5'
          memory: 512M
        reservations:
          memory: 256M
```

### 日志管理

```json
// /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

### 健康检查

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1
```

```bash
# 查看健康状态
docker inspect --format='{{.State.Health.Status}}' my-app
```

---

## 九、常用命令速查

```bash
# 系统信息
docker version
docker info
docker system df              # 磁盘使用

# 清理
docker system prune           # 清理停止的容器、未使用的网络和悬空镜像
docker system prune -a        # 清理所有未使用的资源
docker system prune --volumes # 包括未使用的数据卷

# 导出/导入容器
docker export my-nginx > nginx.tar
docker import nginx.tar my-nginx:imported

# 查看容器资源使用
docker stats
docker stats --no-stream

# 拷贝文件
docker cp my-nginx:/etc/nginx/nginx.conf ./nginx.conf
docker cp ./app.jar my-app:/app/app.jar
```

---

## 总结

Docker 通过容器化技术实现了"构建一次，到处运行"。核心技能包括 Dockerfile 编写、镜像构建、容器管理和 Docker Compose 编排。在生产环境中，注意镜像安全、资源限制和日志管理。Docker 是学习 Kubernetes 的基础，建议先熟练掌握再进入编排领域。
