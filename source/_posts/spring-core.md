---
title: Spring 核心原理深度解析：IoC、AOP 与事务管理
date: 2026-05-28 05:00:00
image: /images/covers/spring-core.svg
tags:
  - Spring
  - Java
  - 后端
categories:
  - 后端
---

## 一、Spring 框架概述

Spring 是一个轻量级的 Java 企业级开发框架，由 Rod Johnson 于 2003 年创建。它的核心使命是**简化 Java 开发**。

### Spring 生态

```
Spring Framework（核心）
├── Spring Boot（快速开发）
├── Spring Cloud（微服务）
├── Spring Data（数据访问）
├── Spring Security（安全）
├── Spring Batch（批处理）
└── Spring WebFlux（响应式）
```

### 核心模块

| 模块 | 功能 |
|---|---|
| Core Container | IoC 容器、Bean 管理 |
| AOP | 面向切面编程 |
| Data Access | JDBC、ORM、事务管理 |
| Web | Web MVC、WebSocket |
| Testing | 单元测试、集成测试 |

---

## 二、IoC 容器

### 什么是 IoC

**IoC（Inversion of Control，控制反转）** 是 Spring 的核心思想。传统开发中，对象的创建和依赖关系由开发者手动管理；IoC 将这个控制权交给 Spring 容器。

```
传统方式：  对象A → 主动创建 → 对象B
IoC方式：  对象A ← 容器注入 ← 对象B
```

### Bean 的定义

```java
// 方式1：注解（推荐）
@Component
public class UserService {
    @Autowired
    private UserRepository userRepository;
}

// 方式2：Java 配置类
@Configuration
public class AppConfig {
    @Bean
    public DataSource dataSource() {
        return new HikariDataSource();
    }
}

// 方式3：XML 配置（旧方式）
// <bean id="userService" class="com.example.UserService"/>
```

### 常用注解

| 注解 | 说明 |
|---|---|
| `@Component` | 通用组件 |
| `@Service` | 业务层 |
| `@Repository` | 数据访问层 |
| `@Controller` | 控制层 |
| `@Configuration` | 配置类 |
| `@Bean` | 定义 Bean |
| `@Autowired` | 自动注入 |
| `@Qualifier` | 按名称注入 |
| `@Value` | 注入配置值 |

### Bean 的作用域

```java
@Component
@Scope("singleton")   // 默认：单例
public class MyBean { }

@Component
@Scope("prototype")   // 每次获取都是新实例
public class MyPrototypeBean { }
```

| 作用域 | 说明 |
|---|---|
| `singleton` | 默认，整个容器一个实例 |
| `prototype` | 每次请求新实例 |
| `request` | 每次 HTTP 请求一个实例 |
| `session` | 每个 HTTP Session 一个实例 |

### Bean 的生命周期

```
1. 实例化（Instantiation）
2. 属性赋值（Populate properties）
3. BeanNameAware / BeanFactoryAware
4. BeanPostProcessor.postProcessBeforeInitialization
5. @PostConstruct / InitializingBean.afterPropertiesSet / init-method
6. BeanPostProcessor.postProcessAfterInitialization
7. 使用中...
8. @PreDestroy / DisposableBean.destroy / destroy-method
```

---

## 三、依赖注入（DI）

### 构造器注入（推荐）

```java
@Service
public class OrderService {
    private final UserService userService;
    private final PaymentService paymentService;

    // Spring 4.3+ 单构造器可省略 @Autowired
    public OrderService(UserService userService, PaymentService paymentService) {
        this.userService = userService;
        this.paymentService = paymentService;
    }
}
```

### Setter 注入

```java
@Service
public class NotificationService {
    private EmailSender emailSender;

    @Autowired
    public void setEmailSender(EmailSender emailSender) {
        this.emailSender = emailSender;
    }
}
```

### 字段注入（不推荐）

```java
@Service
public class BadExample {
    @Autowired
    private SomeDependency dep;  // 不利于测试，隐藏依赖
}
```

### 为什么推荐构造器注入

- **不可变性**：字段可以声明为 `final`
- **完整性**：保证依赖不为空
- **可测试性**：方便单元测试，不需要反射
- **明确性**：依赖一目了然

---

## 四、AOP（面向切面编程）

### 核心概念

```
切面（Aspect）     = 切入点 + 通知
切入点（Pointcut） = 在哪里执行
通知（Advice）     = 执行什么
连接点（JoinPoint）= 可能被拦截的点
```

### 通知类型

```java
@Aspect
@Component
public class LogAspect {

    // 前置通知：方法执行前
    @Before("execution(* com.example.service.*.*(..))")
    public void before(JoinPoint jp) {
        System.out.println("Before: " + jp.getSignature().getName());
    }

    // 后置通知：方法执行后（无论是否异常）
    @After("execution(* com.example.service.*.*(..))")
    public void after(JoinPoint jp) {
        System.out.println("After: " + jp.getSignature().getName());
    }

    // 返回通知：方法正常返回后
    @AfterReturning(pointcut = "execution(* com.example.service.*.*(..))", returning = "result")
    public void afterReturning(Object result) {
        System.out.println("Return: " + result);
    }

    // 异常通知：方法抛出异常后
    @AfterThrowing(pointcut = "execution(* com.example.service.*.*(..))", throwing = "ex")
    public void afterThrowing(Exception ex) {
        System.out.println("Exception: " + ex.getMessage());
    }

    // 环绕通知：最强大，可控制是否执行原方法
    @Around("execution(* com.example.service.*.*(..))")
    public Object around(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.currentTimeMillis();
        Object result = pjp.proceed();
        long cost = System.currentTimeMillis() - start;
        System.out.println(pjp.getSignature().getName() + " cost: " + cost + "ms");
        return result;
    }
}
```

### 切入点表达式

```java
// execution 表达式
execution(* com.example.service.*.*(..))
//  ↑     ↑              ↑   ↑  ↑
// 返回值  包名           类  方法 参数

// 其他指示符
@annotation(com.example.annotation.Log)  // 注解匹配
within(com.example.service.*)            // 类匹配
bean(userService)                        // Bean 名称匹配

// 组合
@Around("@annotation(log)")
public Object aroundLog(ProceedingJoinPoint pjp, Log log) throws Throwable {
    // 同时匹配注解和获取注解参数
}
```

### 自定义注解 + AOP

```java
// 定义注解
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface OperationLog {
    String value() default "";
}

// 切面处理
@Aspect
@Component
public class OperationLogAspect {
    @Around("@annotation(opLog)")
    public Object log(ProceedingJoinPoint pjp, OperationLog opLog) throws Throwable {
        System.out.println("操作: " + opLog.value());
        Object result = pjp.proceed();
        // 保存操作日志到数据库
        return result;
    }
}
```

---

## 五、事务管理

### 声明式事务

```java
@Service
public class AccountService {

    @Transactional
    public void transfer(Long fromId, Long toId, BigDecimal amount) {
        accountRepository.debit(fromId, amount);
        // 如果这里抛出异常，debit 操作会回滚
        accountRepository.credit(toId, amount);
    }
}
```

### 事务传播行为

```java
@Transactional(propagation = Propagation.REQUIRED)    // 默认，加入当前事务
@Transactional(propagation = Propagation.REQUIRES_NEW) // 新建事务，挂起当前事务
@Transactional(propagation = Propagation.NESTED)       // 嵌套事务
@Transactional(propagation = Propagation.SUPPORTS)     // 有事务就加入，没有就非事务执行
@Transactional(propagation = Propagation.NOT_SUPPORTED) // 非事务执行，挂起当前事务
@Transactional(propagation = Propagation.MANDATORY)    // 必须在事务中，否则抛异常
@Transactional(propagation = Propagation.NEVER)        // 必须非事务，否则抛异常
```

### 事务隔离级别

```java
@Transactional(isolation = Isolation.READ_COMMITTED)   // 读已提交（推荐）
@Transactional(isolation = Isolation.REPEATABLE_READ)  // 可重复读
@Transactional(isolation = Isolation.SERIALIZABLE)     // 串行化
```

| 隔离级别 | 脏读 | 不可重复读 | 幻读 |
|---|---|---|---|
| READ_UNCOMMITTED | 有 | 有 | 有 |
| READ_COMMITTED | 无 | 有 | 有 |
| REPEATABLE_READ | 无 | 无 | 有 |
| SERIALIZABLE | 无 | 无 | 无 |

### 回滚规则

```java
// 默认：只对 RuntimeException 和 Error 回滚
@Transactional
public void doSomething() { }

// 指定回滚异常
@Transactional(rollbackFor = Exception.class)
public void doSomething() throws Exception { }

// 指定不回滚的异常
@Transactional(noRollbackFor = BusinessException.class)
public void doSomething() { }
```

### 事务失效的常见场景

1. **方法不是 public**：Spring AOP 代理限制
2. **自调用**：同类中方法调用不走代理
3. **异常被 catch 吞掉**：事务感知不到异常
4. **rollbackFor 配置不当**：默认只回滚 RuntimeException
5. **数据库引擎不支持**：如 MyISAM 不支持事务

---

## 六、Spring MVC 请求处理流程

```
1. 客户端发送请求
2. DispatcherServlet 接收
3. HandlerMapping 查找 Handler
4. HandlerAdapter 执行 Handler
5. Controller 处理业务逻辑
6. 返回 ModelAndView
7. ViewResolver 解析视图
8. 渲染视图并返回响应
```

### 常用注解

```java
@RestController         // = @Controller + @ResponseBody
@RequestMapping("/api")  // 路径映射
@GetMapping("/users")    // GET 请求
@PostMapping("/users")   // POST 请求
@PutMapping("/{id}")     // PUT 请求
@DeleteMapping("/{id}")  // DELETE 请求

@PathVariable            // 路径参数
@RequestParam            // 查询参数
@RequestBody             // 请求体（JSON）
@RequestHeader           // 请求头

@ExceptionHandler        // 异常处理
@ControllerAdvice        // 全局异常处理
```

### 全局异常处理

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public Result<?> handleBusiness(BusinessException e) {
        return Result.fail(e.getCode(), e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public Result<?> handleException(Exception e) {
        log.error("系统异常", e);
        return Result.fail(500, "系统异常");
    }
}
```

---

## 七、常用扩展点

### BeanPostProcessor

```java
@Component
public class MyBeanPostProcessor implements BeanPostProcessor {
    @Override
    public Object postProcessBeforeInitialization(Object bean, String name) {
        // 在 Bean 初始化前执行
        return bean;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String name) {
        // 在 Bean 初始化后执行（AOP 代理在此创建）
        return bean;
    }
}
```

### ApplicationListener

```java
@Component
public class StartupListener implements ApplicationListener<ContextRefreshedEvent> {
    @Override
    public void onApplicationEvent(ContextRefreshedEvent event) {
        // 容器初始化完成后执行
        System.out.println("Spring 容器初始化完成");
    }
}
```

### @EventListener

```java
@Component
public class OrderEventHandler {

    @EventListener
    public void onOrderCreated(OrderCreatedEvent event) {
        System.out.println("订单创建: " + event.getOrderId());
    }
}
```

---

## 总结

Spring 的核心是 IoC 容器和 AOP。理解 Bean 的生命周期、依赖注入方式、事务传播行为和 AOP 的工作原理，是掌握 Spring 的关键。这些知识不仅帮助正确使用 Spring，也是排查复杂问题的基础。
