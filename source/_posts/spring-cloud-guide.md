---
title: Spring Cloud 微服务架构实战：核心组件与实践
date: 2026-05-28 03:00:00
image: /images/covers/spring-cloud-guide.svg
tags:
  - Spring Cloud
  - 微服务
  - Java
categories:
  - 后端
---

## 一、微服务架构概述

微服务架构是一种将单体应用拆分为多个小型、独立服务的架构风格。每个服务围绕业务能力构建，独立开发、部署和扩展。

### 单体 vs 微服务

| 维度 | 单体架构 | 微服务架构 |
|---|---|---|
| 部署 | 整体部署 | 独立部署 |
| 扩展 | 整体扩展 | 按需扩展 |
| 技术栈 | 统一 | 可多样化 |
| 复杂度 | 代码复杂 | 运维复杂 |
| 故障隔离 | 差 | 好 |
| 团队协作 | 冲突多 | 独立开发 |

### 微服务核心问题

```
服务拆分 → 服务通信 → 服务注册发现 → 负载均衡
    ↓           ↓           ↓            ↓
服务配置 → 网关路由 → 熔断限流 → 链路追踪
```

---

## 二、Spring Cloud 体系

### 技术选型对比

| 功能 | Spring Cloud Netflix | Spring Cloud Alibaba | 替代方案 |
|---|---|---|---|
| 注册中心 | Eureka | Nacos | Consul, ZooKeeper |
| 配置中心 | Spring Cloud Config | Nacos Config | Apollo |
| 网关 | Zuul | - | Spring Cloud Gateway |
| 负载均衡 | Ribbon | - | Spring Cloud LoadBalancer |
| 熔断器 | Hystrix | Sentinel | Resilience4j |
| 远程调用 | Feign | OpenFeign | RestTemplate |
| 消息驱动 | - | RocketMQ | Spring Cloud Stream |

### 依赖管理

```xml
<dependencyManagement>
    <dependencies>
        <!-- Spring Cloud -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>2023.0.0</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
        <!-- Spring Cloud Alibaba -->
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-alibaba-dependencies</artifactId>
            <version>2023.0.0.0</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

---

## 三、服务注册与发现（Nacos）

### Nacos 简介

Nacos 是阿里巴巴开源的服务注册中心和配置中心，同时支持 CP（配置中心）和 AP（服务发现）模式。

### 服务端安装

```bash
# Docker 方式
docker run -d --name nacos -e MODE=standalone -p 8848:8848 nacos/nacos-server

# 访问控制台
# http://localhost:8848/nacos  （默认账号 nacos/nacos）
```

### 客户端接入

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
```

```yaml
spring:
  application:
    name: user-service
  cloud:
    nacos:
      discovery:
        server-addr: localhost:8848
        namespace: dev          # 命名空间
        group: DEFAULT_GROUP    # 分组
```

### 服务发现原理

```
1. 服务启动时向 Nacos 注册（IP + 端口 + 元数据）
2. Nacos 通过心跳检测服务健康状态
3. 消费者从 Nacos 获取服务列表
4. 消费者通过负载均衡选择一个实例调用
5. 服务下线时自动注销
```

---

## 四、远程调用（OpenFeign）

### 基本使用

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
</dependency>
```

```java
// 启动类
@EnableFeignClients
@SpringBootApplication
public class OrderApplication { }

// Feign 客户端
@FeignClient(name = "user-service", fallbackFactory = UserClientFallback.class)
public interface UserClient {

    @GetMapping("/api/users/{id}")
    Result<User> getUserById(@PathVariable("id") Long id);

    @PostMapping("/api/users/batch")
    Result<List<User>> getUsersByIds(@RequestBody List<Long> ids);
}

// 降级处理
@Component
public class UserClientFallback implements FallbackFactory<UserClient> {
    @Override
    public UserClient create(Throwable cause) {
        return new UserClient() {
            @Override
            public Result<User> getUserById(Long id) {
                return Result.fail(500, "用户服务不可用");
            }

            @Override
            public Result<List<User>> getUsersByIds(List<Long> ids) {
                return Result.fail(500, "用户服务不可用");
            }
        };
    }
}
```

### 请求拦截器

```java
@Configuration
public class FeignConfig {

    @Bean
    public RequestInterceptor requestInterceptor() {
        return template -> {
            // 传递请求头（如认证信息）
            ServletRequestAttributes attributes =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                String token = attributes.getRequest().getHeader("Authorization");
                template.header("Authorization", token);
            }
        };
    }
}
```

---

## 五、API 网关（Spring Cloud Gateway）

### 网关作用

```
客户端 → 网关 → 认证鉴权 → 路由转发 → 限流熔断 → 后端服务
```

### 基本配置

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-gateway</artifactId>
</dependency>
```

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: user-service
          uri: lb://user-service          # 负载均衡
          predicates:
            - Path=/api/users/**
          filters:
            - StripPrefix=1               # 去掉前缀

        - id: order-service
          uri: lb://order-service
          predicates:
            - Path=/api/orders/**
          filters:
            - StripPrefix=1
            - name: RequestRateLimiter     # 限流
              args:
                redis-rate-limiter.replenishRate: 10
                redis-rate-limiter.burstCapacity: 20

      # 全局跨域
      globalcors:
        cors-configurations:
          '[/**]':
            allowedOrigins: "*"
            allowedMethods: "*"
```

### 全局过滤器

```java
@Component
public class AuthGlobalFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String token = exchange.getRequest().getHeaders().getFirst("Authorization");

        // 白名单
        String path = exchange.getRequest().getURI().getPath();
        if (path.startsWith("/api/auth/")) {
            return chain.filter(exchange);
        }

        // 验证 token
        if (token == null || !JwtUtils.validate(token)) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return -1; // 优先级
    }
}
```

---

## 六、配置中心（Nacos Config）

### 配置管理

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-bootstrap</artifactId>
</dependency>
```

```yaml
# bootstrap.yml
spring:
  application:
    name: user-service
  cloud:
    nacos:
      config:
        server-addr: localhost:8848
        file-extension: yml
        namespace: dev
        group: DEFAULT_GROUP
        shared-configs:
          - data-id: common.yml
            group: DEFAULT_GROUP
            refresh: true
```

### 动态刷新

```java
@RestController
@RefreshScope  // 支持动态刷新
public class ConfigController {

    @Value("${app.custom.value}")
    private String customValue;

    @GetMapping("/config")
    public String getConfig() {
        return customValue;
    }
}
```

---

## 七、服务熔断与限流（Sentinel）

### Sentinel 简介

Sentinel 是阿里巴巴开源的流量治理组件，提供熔断降级、流量控制、系统负载保护等功能。

### 基本使用

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-sentinel</artifactId>
</dependency>
```

```yaml
spring:
  cloud:
    sentinel:
      transport:
        dashboard: localhost:8080  # Sentinel 控制台
```

### 熔断规则

```java
// 注解方式
@Service
public class ProductService {

    @SentinelResource(
        value = "getProduct",
        fallback = "getProductFallback",
        blockHandler = "getProductBlock"
    )
    public Product getProduct(Long id) {
        // 远程调用可能失败
        return productClient.getById(id);
    }

    // 降级方法
    public Product getProductFallback(Long id, Throwable e) {
        return new Product(id, "默认商品", BigDecimal.ZERO);
    }

    // 限流方法
    public Product getProductBlock(Long id, BlockException e) {
        throw new RuntimeException("服务限流，请稍后重试");
    }
}
```

### 熔断策略

| 策略 | 说明 | 阈值 |
|---|---|---|
| 慢调用比例 | 响应时间超过阈值的比例 | 最大 RT + 比例 |
| 异常比例 | 异常请求的比例 | 比例阈值 |
| 异常数 | 异常请求的数量 | 数量阈值 |

---

## 八、分布式事务（Seata）

### 问题场景

```
下单流程：
  订单服务：创建订单     ← 本地事务
  库存服务：扣减库存     ← 远程调用（独立事务）
  账户服务：扣减余额     ← 远程调用（独立事务）

如果账户扣减失败，订单和库存如何回滚？
```

### Seata 模式

| 模式 | 原理 | 适用场景 |
|---|---|---|
| AT | 自动生成逆向 SQL 回滚 | 大多数场景 |
| TCC | 手动编写 Try/Confirm/Cancel | 高性能场景 |
| Saga | 长事务，正向操作 + 补偿操作 | 长流程业务 |

### AT 模式使用

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-seata</artifactId>
</dependency>
```

```java
@Service
public class OrderService {

    @GlobalTransactional  // 开启全局事务
    public void createOrder(OrderDTO dto) {
        // 1. 创建订单（本地事务）
        orderMapper.insert(order);

        // 2. 扣减库存（远程调用）
        inventoryClient.deduct(dto.getProductId(), dto.getCount());

        // 3. 扣减余额（远程调用）
        accountClient.debit(dto.getUserId(), dto.getTotalAmount());

        // 任一环节失败，全局回滚
    }
}
```

---

## 九、消息驱动（RocketMQ）

### 基本使用

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-stream-rocketmq</artifactId>
</dependency>
```

```java
// 生产者
@Service
public class OrderMessageProducer {
    @Autowired
    private StreamBridge streamBridge;

    public void sendOrderCreated(Long orderId) {
        streamBridge.send("order-created-out-0",
            MessageBuilder.withPayload(orderId).build());
    }
}

// 消费者
@Component
public class OrderMessageConsumer {

    @Bean
    public Consumer<Message<Long>> orderCreated() {
        return message -> {
            Long orderId = message.getPayload();
            System.out.println("收到订单消息: " + orderId);
            // 处理业务逻辑
        };
    }
}
```

### 延迟消息

```java
// 延迟消息（如订单超时取消）
Message<Long> message = MessageBuilder
    .withPayload(orderId)
    .setHeader("DELAY", 18)  // 延迟级别
    .build();
streamBridge.send("order-timeout-out-0", message);
```

---

## 十、链路追踪（SkyWalking）

### 为什么需要链路追踪

微服务架构中，一个请求可能经过多个服务，出了问题很难定位。链路追踪可以：

- 可视化请求的完整调用链
- 快速定位性能瓶颈和异常节点
- 分析服务间的依赖关系

### 接入方式

```bash
# 下载 SkyWalking Agent
# https://skywalking.apache.org/downloads/

# 启动时加入 Agent
java -javaagent:/path/to/skywalking-agent.jar \
     -Dskywalking.agent.service_name=my-service \
     -Dskywalking.collector.backend_service=localhost:11800 \
     -jar app.jar
```

---

## 十一、微服务最佳实践

### 服务拆分原则

1. **单一职责**：每个服务只负责一个业务领域
2. **高内聚低耦合**：服务内部紧密相关，服务之间松散依赖
3. **按业务能力拆分**：而非按技术层拆分
4. **数据自治**：每个服务拥有自己的数据库

### 服务通信选择

| 方式 | 适用场景 | 示例 |
|---|---|---|
| 同步调用 | 实时查询 | OpenFeign, RestTemplate |
| 异步消息 | 解耦、削峰 | RocketMQ, RabbitMQ |
| 事件驱动 | 最终一致性 | Domain Event |

### 容错策略

```yaml
# 1. 超时控制
feign:
  client:
    config:
      default:
        connectTimeout: 5000
        readTimeout: 10000

# 2. 重试机制
ribbon:
  MaxAutoRetries: 1
  MaxAutoRetriesNextServer: 2

# 3. 熔断降级
# Sentinel / Resilience4j

# 4. 限流
# Sentinel / Gateway 限流
```

### 配置管理建议

- 公共配置抽取到 `shared-configs`
- 敏感配置使用加密或环境变量
- 不同环境使用不同命名空间
- 配置变更使用灰度发布

---

## 总结

Spring Cloud 为微服务架构提供了完整的解决方案。核心组件包括服务注册发现（Nacos）、远程调用（OpenFeign）、API 网关（Gateway）、配置中心（Nacos Config）、熔断限流（Sentinel）和分布式事务（Seata）。在实际项目中，应根据业务规模和技术团队选择合适的组件，避免过度设计。
