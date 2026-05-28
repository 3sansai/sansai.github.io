---
title: Nginx 从入门到实战：核心概念与配置指南
date: 2026-05-28
tags:
  - Nginx
  - 服务器
  - 运维
categories:
  - 技术
---

## 一、Nginx 简介

Nginx（engine x）是一个高性能的 HTTP 和反向代理服务器，由 Igor Sysoev 于 2004 年发布。它以**高并发、低内存消耗、高稳定性**著称，是全球使用最广泛的 Web 服务器之一。

### 核心特性

- **事件驱动架构**：基于 epoll/kqueue 的异步非阻塞模型
- **反向代理与负载均衡**：天然支持多种负载均衡策略
- **静态资源服务**：极高的静态文件处理能力
- **模块化设计**：功能通过模块扩展，灵活可定制

### 与 Apache 的对比

| 特性 | Nginx | Apache |
|---|---|---|
| 并发模型 | 事件驱动，异步非阻塞 | 进程/线程模型 |
| 内存占用 | 低 | 相对较高 |
| 静态文件 | 极快 | 一般 |
| 动态内容 | 通过 FastCGI/反向代理 | 内置 mod_php 等 |
| 配置风格 | 集中式配置 | 分布式 .htaccess |

---

## 二、安装与管理

### Ubuntu/Debian 安装

```bash
sudo apt update
sudo apt install nginx
```

### CentOS/RHEL 安装

```bash
sudo yum install epel-release
sudo yum install nginx
```

### 常用管理命令

```bash
# 启动
sudo systemctl start nginx

# 停止
sudo systemctl stop nginx

# 重启
sudo systemctl restart nginx

# 重新加载配置（不中断服务）
sudo systemctl reload nginx

# 查看状态
sudo systemctl status nginx

# 测试配置文件语法
sudo nginx -t
```

---

## 三、核心配置详解

### 配置文件结构

Nginx 配置文件通常位于 `/etc/nginx/nginx.conf`，结构如下：

```nginx
# 全局块
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

# events 块
events {
    worker_connections 1024;
    use epoll;
}

# http 块
http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent"';

    # server 块
    server {
        listen 80;
        server_name example.com;

        location / {
            root /var/www/html;
            index index.html;
        }
    }
}
```

### 配置层级关系

```
main（全局）
├── events
└── http
    ├── upstream
    └── server
        ├── location
        └── location
```

---

## 四、反向代理

### 基本反向代理

```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### WebSocket 代理

```nginx
location /ws/ {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

---

## 五、负载均衡

### 轮询（默认）

```nginx
upstream backend {
    server 192.168.1.1:8080;
    server 192.168.1.2:8080;
    server 192.168.1.3:8080;
}
```

### 加权轮询

```nginx
upstream backend {
    server 192.168.1.1:8080 weight=5;
    server 192.168.1.2:8080 weight=3;
    server 192.168.1.3:8080 weight=2;
}
```

### IP Hash（会话保持）

```nginx
upstream backend {
    ip_hash;
    server 192.168.1.1:8080;
    server 192.168.1.2:8080;
}
```

### 最少连接

```nginx
upstream backend {
    least_conn;
    server 192.168.1.1:8080;
    server 192.168.1.2:8080;
}
```

---

## 六、Location 匹配规则

匹配优先级从高到低：

```nginx
# 1. 精确匹配（优先级最高）
location = /api {
    # 只匹配 /api
}

# 2. 前缀匹配（停止搜索）
location ^~ /static/ {
    # 匹配以 /static/ 开头的请求，不再检查正则
}

# 3. 正则匹配（按配置顺序）
location ~* \.(jpg|png|gif)$ {
    # 匹配图片文件（不区分大小写）
}

# 4. 普通前缀匹配
location /api/ {
    # 匹配以 /api/ 开头的请求
}

# 5. 默认匹配
location / {
    # 兜底
}
```

---

## 七、HTTPS 配置

### SSL 证书配置

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate     /etc/nginx/ssl/example.com.crt;
    ssl_certificate_key /etc/nginx/ssl/example.com.key;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # 强制 HTTPS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        root /var/www/html;
    }
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 八、性能优化

### Gzip 压缩

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml;
gzip_min_length 1024;
gzip_comp_level 6;
gzip_vary on;
```

### 静态资源缓存

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 30d;
    add_header Cache-Control "public, no-transform";
}
```

### 连接优化

```nginx
http {
    keepalive_timeout 65;
    keepalive_requests 100;

    client_max_body_size 50m;
    client_body_buffer_size 128k;

    # 开启 sendfile
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
}
```

---

## 九、常见应用场景

### 1. SPA 应用部署

```nginx
server {
    listen 80;
    server_name app.example.com;
    root /var/www/app;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
    }
}
```

### 2. 文件服务器

```nginx
server {
    listen 80;
    server_name files.example.com;

    location / {
        root /data/files;
        autoindex on;
        autoindex_exact_size off;
        autoindex_localtime on;
    }
}
```

### 3. 跨域配置（CORS）

```nginx
location /api/ {
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type, Authorization";

    if ($request_method = OPTIONS) {
        return 204;
    }

    proxy_pass http://backend;
}
```

---

## 十、故障排查

```bash
# 查看错误日志
tail -f /var/log/nginx/error.log

# 查看访问日志
tail -f /var/log/nginx/access.log

# 测试配置语法
sudo nginx -t

# 查看 Nginx 编译参数
nginx -V

# 检查端口占用
sudo ss -tlnp | grep nginx
```

---

## 总结

Nginx 的核心优势在于其事件驱动的架构设计，使其在高并发场景下表现优异。掌握反向代理、负载均衡、Location 匹配和 HTTPS 配置是使用 Nginx 的基本功。在实际项目中，合理使用缓存和压缩策略可以显著提升服务性能。
