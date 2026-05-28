---
title: MySQL 数据库开发实战指南：从设计到优化
date: 2026-05-27
tags:
  - MySQL
  - 数据库
  - SQL
categories:
  - 技术
---

## 一、MySQL 概述

MySQL 是全球最流行的开源关系型数据库管理系统，由 Oracle 公司维护。它以**高性能、高可靠性、易用性**著称，是 Web 应用的首选数据库。

### 存储引擎对比

| 特性 | InnoDB | MyISAM |
|---|---|---|
| 事务支持 | 支持 | 不支持 |
| 行级锁 | 支持 | 仅表锁 |
| 外键 | 支持 | 不支持 |
| 崩溃恢复 | 支持 | 不支持 |
| 全文索引 | 支持（5.6+） | 支持 |
| 适用场景 | OLTP（推荐） | 读密集、无事务 |

**日常开发统一使用 InnoDB。**

---

## 二、表设计规范

### 命名规范

```sql
-- 表名：小写 + 下划线，名词复数或业务含义
CREATE TABLE user_orders (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
    order_no VARCHAR(32) NOT NULL COMMENT '订单号',
    amount DECIMAL(10,2) NOT NULL COMMENT '金额',
    status TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0待支付 1已支付 2已取消',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_order_no (order_no),
    KEY idx_user_id (user_id),
    KEY idx_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';
```

### 字段设计原则

| 规则 | 说明 |
|---|---|
| 主键用 BIGINT | 自增或雪花算法，不用 UUID |
| 金额用 DECIMAL | 不用 FLOAT/DOUBLE，避免精度丢失 |
| 时间用 DATETIME | 不用 TIMESTAMP（2038 年问题） |
| 字符串用 VARCHAR | 长度按需分配，不滥用 TEXT |
| 状态用 TINYINT | 配合注释说明含义 |
| 必须有注释 | 字段和表都要有 COMMENT |
| 必须有主键 | 每张表都要有自增主键 |
| NOT NULL | 尽量避免 NULL，设默认值 |

### 三大范式

- **第一范式（1NF）**：字段不可再分（原子性）
- **第二范式（2NF）**：非主键字段完全依赖主键
- **第三范式（3NF）**：非主键字段不传递依赖

实际开发中允许适当反范式化（冗余字段）以提升查询性能。

---

## 三、SQL 编写技巧

### 查询优化

```sql
-- 避免 SELECT *
SELECT id, username, email FROM users WHERE status = 1;

-- 分页优化（大偏移量）
-- 慢：SELECT * FROM orders LIMIT 100000, 10;
-- 快：
SELECT * FROM orders WHERE id > 100000 ORDER BY id LIMIT 10;

-- 批量插入
INSERT INTO users (name, email) VALUES
('Alice', 'alice@example.com'),
('Bob', 'bob@example.com'),
('Charlie', 'charlie@example.com');

-- EXISTS vs IN（子查询大表用 EXISTS）
SELECT * FROM users u
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);

-- 窗口函数（MySQL 8.0+）
SELECT
    user_id,
    amount,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY amount DESC) AS rn
FROM orders;
```

### 聚合与分组

```sql
-- 常用聚合函数
SELECT
    COUNT(*) AS total,
    SUM(amount) AS sum_amount,
    AVG(amount) AS avg_amount,
    MAX(amount) AS max_amount,
    MIN(amount) AS min_amount
FROM orders
WHERE status = 1;

-- HAVING 过滤分组结果
SELECT user_id, SUM(amount) AS total
FROM orders
GROUP BY user_id
HAVING total > 1000;

-- GROUP_CONCAT
SELECT user_id, GROUP_CONCAT(order_no SEPARATOR ', ') AS order_nos
FROM orders
GROUP BY user_id;
```

### JOIN 操作

```sql
-- 内连接：两边都匹配
SELECT u.name, o.order_no
FROM users u
INNER JOIN orders o ON u.id = o.user_id;

-- 左连接：保留左表全部
SELECT u.name, COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id;

-- 自连接
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;
```

---

## 四、索引深入

### 索引类型

```sql
-- 主键索引
PRIMARY KEY (id)

-- 唯一索引
UNIQUE KEY uk_email (email)

-- 普通索引
KEY idx_name (name)

-- 联合索引（最左前缀原则）
KEY idx_status_time (status, created_at)

-- 全文索引
FULLTEXT INDEX ft_content (content)
```

### 最左前缀原则

```sql
-- 联合索引 (a, b, c)
-- 以下查询能命中索引：
WHERE a = 1
WHERE a = 1 AND b = 2
WHERE a = 1 AND b = 2 AND c = 3
WHERE a = 1 AND c = 3        -- 只用到 a
WHERE a = 1 ORDER BY b       -- a 等值 + b 排序

-- 以下不能命中：
WHERE b = 2                   -- 跳过了 a
WHERE b = 2 AND c = 3        -- 跳过了 a
```

### 索引失效场景

```sql
-- 1. 对索引列使用函数
WHERE YEAR(created_at) = 2026     -- 失效
WHERE created_at >= '2026-01-01'  -- 生效

-- 2. 隐式类型转换
WHERE phone = 13800138000         -- 失效（phone 是 VARCHAR）
WHERE phone = '13800138000'      -- 生效

-- 3. LIKE 左模糊
WHERE name LIKE '%张'             -- 失效
WHERE name LIKE '张%'            -- 生效

-- 4. OR 条件中有非索引列
WHERE indexed_col = 1 OR non_indexed_col = 2  -- 失效

-- 5. 不等于（!= 或 <>）
WHERE status != 1                 -- 可能失效
```

### EXPLAIN 分析

```sql
EXPLAIN SELECT * FROM orders WHERE user_id = 100;
```

| 字段 | 说明 |
|---|---|
| type | 访问类型：ALL < index < range < ref < eq_ref < const |
| key | 实际使用的索引 |
| rows | 预估扫描行数 |
| Extra | Using index（覆盖索引）、Using filesort（需优化） |

---

## 五、事务与锁

### 事务 ACID

- **A（原子性）**：要么全做，要么全不做
- **C（一致性）**：事务前后数据一致
- **I（隔离性）**：事务间互不干扰
- **D（持久性）**：提交后永久生效

### 隔离级别

```sql
-- 查看当前隔离级别
SELECT @@transaction_isolation;

-- 设置隔离级别
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;
```

| 隔离级别 | 脏读 | 不可重复读 | 幻读 |
|---|---|---|---|
| READ UNCOMMITTED | 有 | 有 | 有 |
| READ COMMITTED | 无 | 有 | 有 |
| REPEATABLE READ（默认） | 无 | 无 | 有* |
| SERIALIZABLE | 无 | 无 | 无 |

*InnoDB 在 RR 级别通过 MVCC + Gap Lock 解决了大部分幻读问题。

### 锁机制

```sql
-- 行锁（InnoDB）
SELECT * FROM orders WHERE id = 1 FOR UPDATE;  -- 排他锁
SELECT * FROM orders WHERE id = 1 LOCK IN SHARE MODE;  -- 共享锁

-- 间隙锁（防止幻读）
-- 锁定范围，防止其他事务在间隙中插入数据

-- 死锁排查
SHOW ENGINE INNODB STATUS;
```

---

## 六、慢查询优化

### 开启慢查询日志

```sql
-- 查看配置
SHOW VARIABLES LIKE 'slow_query%';

-- 开启
SET GLOBAL slow_query_log = ON;
SET GLOBAL long_query_time = 1;  -- 超过1秒记录
```

### 优化步骤

```
1. 开启慢查询日志，找出慢 SQL
2. EXPLAIN 分析执行计划
3. 检查是否命中索引
4. 优化 SQL 或添加合适索引
5. 必要时拆分大查询
```

### 常见优化手段

```sql
-- 1. 避免回表（覆盖索引）
-- 如果索引已包含查询字段，无需回表
SELECT user_id, status FROM orders WHERE user_id = 100;
-- 索引：KEY idx_user_status (user_id, status)

-- 2. 批量操作代替循环
-- 慢：1000 次 INSERT
-- 快：一次批量 INSERT 1000 条

-- 3. 合理使用临时表
CREATE TEMPORARY TABLE tmp_user_ids (user_id BIGINT);
INSERT INTO tmp_user_ids VALUES (1), (2), (3);
SELECT * FROM orders WHERE user_id IN (SELECT user_id FROM tmp_user_ids);

-- 4. 大表分批处理
DELETE FROM logs WHERE created_at < '2025-01-01' LIMIT 1000;
-- 循环执行直到影响行数为 0
```

---

## 七、数据安全

### 备份与恢复

```bash
# 全量备份
mysqldump -u root -p --all-databases > backup.sql

# 单库备份
mysqldump -u root -p mydb > mydb.sql

# 恢复
mysql -u root -p mydb < mydb.sql

# 增量备份（基于 binlog）
mysqlbinlog binlog.000001 | mysql -u root -p
```

### SQL 注入防护

```java
// 使用参数化查询，禁止字符串拼接
// 错误
String sql = "SELECT * FROM users WHERE name = '" + name + "'";

// 正确（PreparedStatement）
String sql = "SELECT * FROM users WHERE name = ?";
PreparedStatement ps = conn.prepareStatement(sql);
ps.setString(1, name);
```

---

## 八、分库分表

### 何时需要

- 单表数据超过 1000 万行
- 单库写入 QPS 超过 5000
- 磁盘容量不足

### 分表策略

| 策略 | 说明 | 适用场景 |
|---|---|---|
| 范围分表 | 按 ID 或时间范围 | 数据增长均匀 |
| Hash 分表 | 按 ID 取模 | 数据分布均匀 |
| 日期分表 | 按月/年分表 | 日志、流水类数据 |

### 常用中间件

- **ShardingSphere**：Apache 开源，支持分库分表、读写分离
- **MyCat**：数据库中间件
- **Vitess**：YouTube 开源，适合大规模场景

---

## 总结

MySQL 是后端开发的必备技能。表设计要规范，索引要合理，SQL 要优化。通过 EXPLAIN 分析执行计划，通过慢查询日志发现问题，通过分库分表应对大数据量。掌握这些核心知识，能应对绝大多数业务场景。
