---
title: Spring Boot 实战指南：快速开发与最佳实践
date: 2026-05-28
tags:
  - Spring Boot
  - Java
  - 后端
categories:
  - 技术
---

## 一、Spring Boot 概述

Spring Boot 是基于 Spring 框架的快速开发工具，核心理念是**约定优于配置**。它通过自动配置、起步依赖和嵌入式服务器，让开发者能快速搭建生产级应用。

### 核心特性

- **自动配置（Auto Configuration）**：根据依赖自动配置 Bean
- **起步依赖（Starter）**：一站式依赖管理
- **嵌入式服务器**：内置 Tomcat/Jetty/Undertow
- **Actuator**：生产级监控和管理端点
- **外部化配置**：支持多种配置源

### 项目结构

```
my-app/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/example/
│   │   │       ├── Application.java      # 启动类
│   │   │       ├── controller/            # 控制层
│   │   │       ├── service/               # 业务层
│   │   │       ├── repository/            # 数据层
│   │   │       ├── entity/                # 实体类
│   │   │       ├── dto/                   # 数据传输对象
│   │   │       ├── config/                # 配置类
│   │   │       └── common/                # 通用工具
│   │   └── resources/
│   │       ├── application.yml            # 配置文件
│   │       ├── static/                    # 静态资源
│   │       └── templates/                 # 模板文件
│   └── test/                              # 测试
├── pom.xml
└── README.md
```

---

## 二、快速开始

### 创建项目

使用 Spring Initializr（https://start.spring.io）或 Maven：

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.0</version>
</parent>

<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
</dependencies>
```

### 启动类

```java
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

`@SpringBootApplication` 等价于：

```java
@SpringBootConfiguration   // 标记为配置类
@EnableAutoConfiguration   // 启用自动配置
@ComponentScan             // 扫描组件
```

---

## 三、配置管理

### application.yml

```yaml
server:
  port: 8080
  servlet:
    context-path: /api

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mydb?useSSL=false&serverTimezone=UTC
    username: root
    password: ${DB_PASSWORD}  # 环境变量
    driver-class-name: com.mysql.cj.jdbc.Driver

  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true

  redis:
    host: localhost
    port: 6379

# 自定义配置
app:
  name: My Application
  jwt:
    secret: my-secret-key
    expiration: 86400000
```

### 配置读取

```java
// 方式1：@Value
@Value("${app.name}")
private String appName;

// 方式2：@ConfigurationProperties（推荐）
@Component
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {
    private String secret;
    private long expiration;
    // getter/setter
}
```

### 多环境配置

```
application.yml           # 公共配置
application-dev.yml       # 开发环境
application-test.yml      # 测试环境
application-prod.yml      # 生产环境
```

激活方式：

```yaml
# application.yml
spring:
  profiles:
    active: dev
```

```bash
# 命令行
java -jar app.jar --spring.profiles.active=prod

# 环境变量
export SPRING_PROFILES_ACTIVE=prod
```

---

## 四、Web 开发

### RESTful API

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public Result<List<User>> list() {
        return Result.success(userService.findAll());
    }

    @GetMapping("/{id}")
    public Result<User> getById(@PathVariable Long id) {
        return Result.success(userService.findById(id));
    }

    @PostMapping
    public Result<User> create(@Valid @RequestBody UserDTO dto) {
        return Result.success(userService.create(dto));
    }

    @PutMapping("/{id}")
    public Result<User> update(@PathVariable Long id, @Valid @RequestBody UserDTO dto) {
        return Result.success(userService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        userService.delete(id);
        return Result.success();
    }
}
```

### 统一响应封装

```java
@Data
public class Result<T> {
    private int code;
    private String message;
    private T data;

    public static <T> Result<T> success() {
        return success(null);
    }

    public static <T> Result<T> success(T data) {
        Result<T> r = new Result<>();
        r.setCode(200);
        r.setMessage("success");
        r.setData(data);
        return r;
    }

    public static <T> Result<T> fail(int code, String message) {
        Result<T> r = new Result<>();
        r.setCode(code);
        r.setMessage(message);
        return r;
    }
}
```

### 参数校验

```java
@Data
public class UserDTO {
    @NotBlank(message = "用户名不能为空")
    @Size(min = 2, max = 20, message = "用户名长度 2-20")
    private String username;

    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;

    @NotNull(message = "年龄不能为空")
    @Min(value = 0, message = "年龄不能为负数")
    @Max(value = 150, message = "年龄不能超过 150")
    private Integer age;
}
```

### 全局异常处理

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result<?> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
            .map(FieldError::getDefaultMessage)
            .collect(Collectors.joining(", "));
        return Result.fail(400, message);
    }

    @ExceptionHandler(BusinessException.class)
    public Result<?> handleBusiness(BusinessException e) {
        return Result.fail(e.getCode(), e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public Result<?> handleException(Exception e) {
        log.error("系统异常", e);
        return Result.fail(500, "系统内部错误");
    }
}
```

---

## 五、数据访问

### Spring Data JPA

```java
// 实体类
@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    private String email;
    private LocalDateTime createTime;
}

// Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    List<User> findByEmailContaining(String keyword);

    @Query("SELECT u FROM User u WHERE u.createTime > :date")
    List<User> findRecentUsers(@Param("date") LocalDateTime date);
}

// Service
@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    public Page<User> findPage(int page, int size) {
        return userRepository.findAll(PageRequest.of(page, size, Sort.by("createTime").descending()));
    }
}
```

### MyBatis Plus

```java
// Mapper
@Mapper
public interface UserMapper extends BaseMapper<User> {
    @Select("SELECT * FROM users WHERE username = #{username}")
    User findByUsername(String username);
}

// Service
@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {
    public IPage<User> findPage(int page, int size) {
        return page(new Page<>(page, size), new QueryWrapper<User>().orderByDesc("create_time"));
    }
}
```

### Redis 缓存

```java
@Service
public class CacheService {
    @Autowired
    private StringRedisTemplate redisTemplate;

    public void set(String key, String value, long timeout) {
        redisTemplate.opsForValue().set(key, value, timeout, TimeUnit.SECONDS);
    }

    public String get(String key) {
        return redisTemplate.opsForValue().get(key);
    }
}

// 使用 Spring Cache 注解
@Service
public class UserService {
    @Cacheable(value = "users", key = "#id")
    public User findById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    @CacheEvict(value = "users", key = "#id")
    public void delete(Long id) {
        userRepository.deleteById(id);
    }
}
```

---

## 六、拦截器与过滤器

### 拦截器

```java
@Component
public class AuthInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
                             Object handler) throws Exception {
        String token = request.getHeader("Authorization");
        if (token == null || !JwtUtils.validate(token)) {
            response.setStatus(401);
            return false;
        }
        return true;
    }
}

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Autowired
    private AuthInterceptor authInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor)
            .addPathPatterns("/api/**")
            .excludePathPatterns("/api/auth/**");
    }
}
```

### 过滤器

```java
@WebFilter(urlPatterns = "/*")
@Order(1)
public class CorsFilter implements Filter {
    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        HttpServletResponse response = (HttpServletResponse) res;
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
        chain.doFilter(req, res);
    }
}
```

---

## 七、常用 Starter

| Starter | 功能 |
|---|---|
| `spring-boot-starter-web` | Web 开发、REST API |
| `spring-boot-starter-data-jpa` | JPA 数据访问 |
| `spring-boot-starter-data-redis` | Redis 缓存 |
| `spring-boot-starter-security` | 安全认证 |
| `spring-boot-starter-validation` | 参数校验 |
| `spring-boot-starter-mail` | 邮件发送 |
| `spring-boot-starter-quartz` | 定时任务 |
| `spring-boot-starter-amqp` | RabbitMQ |
| `spring-boot-starter-test` | 测试 |
| `spring-boot-starter-actuator` | 监控端点 |

---

## 八、Actuator 监控

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,env
  endpoint:
    health:
      show-details: always
```

常用端点：

```bash
/actuator/health       # 健康检查
/actuator/info         # 应用信息
/actuator/metrics      # 指标数据
/actuator/env          # 环境变量
/actuator/loggers      # 日志级别
```

---

## 九、打包与部署

### Maven 打包

```bash
# 打包（跳过测试）
mvn clean package -DskipTests

# 运行
java -jar target/app.jar

# 指定配置文件
java -jar app.jar --spring.profiles.active=prod

# JVM 参数
java -Xms512m -Xmx1024m -jar app.jar
```

### Docker 部署

```dockerfile
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

```bash
docker build -t my-app .
docker run -p 8080:8080 my-app
```

---

## 十、最佳实践

1. **分层架构**：Controller → Service → Repository，职责清晰
2. **统一响应**：封装 Result 类，统一返回格式
3. **全局异常处理**：`@RestControllerAdvice` 统一处理
4. **参数校验**：使用 `@Valid` + JSR 303 注解
5. **配置外部化**：敏感信息使用环境变量或配置中心
6. **日志规范**：使用 SLF4J，不同级别合理使用
7. **接口文档**：集成 Swagger/SpringDoc
8. **单元测试**：核心业务逻辑编写测试用例
9. **优雅关闭**：配置 `server.shutdown=graceful`
10. **健康检查**：集成 Actuator，配合 K8s 使用

---

## 总结

Spring Boot 通过自动配置和起步依赖大幅简化了 Spring 应用的开发。掌握配置管理、Web 开发、数据访问和监控是使用 Spring Boot 的核心技能。在实际项目中，遵循分层架构和最佳实践，能让代码更易维护和扩展。
