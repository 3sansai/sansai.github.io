---
title: Skill 是 Agent 的具体技能：模块化 AI 能力设计
date: 2026-05-28 14:00:00
tags:
  - Skill
  - Agent
  - AI
  - 设计模式
categories:
  - AI
---

## 前言

如果 Agent 是一个人，Skill 就是这个人掌握的具体技能。一个人会"做饭"，不是因为天生就会，而是掌握了"切菜"、"炒菜"、"调味"等一系列技能，并能根据情况灵活组合。Agent 的 Skill 也是同样的道理。

---

## 一、Skill vs Tool：搞清楚区别

很多人把 Skill 和 Tool 搞混，它们的本质区别：

```
Tool（工具）= 原子操作，被动执行
  read_file()     → 只读文件，不做判断
  execute_command() → 只执行命令，不管结果
  search()         → 只搜索，不分析

Skill（技能）= 组合多个工具，包含判断逻辑
  "代码审查" Skill：
    1. 调用 read_file() 读取代码
    2. 分析代码逻辑（AI 推理）
    3. 调用 search() 检查依赖
    4. 判断是否有安全问题（AI 推理）
    5. 生成审查报告（AI 生成）

  "部署应用" Skill：
    1. 调用 execute_command() 运行测试
    2. 判断测试是否通过（条件判断）
    3. 调用 execute_command() 构建镜像
    4. 调用 execute_command() 推送到仓库
    5. 调用 execute_command() 更新 K8s 部署
    6. 调用 execute_command() 检查部署状态
```

类比：

```
Tool = 锤子、螺丝刀、扳手
Skill = 木工手艺（知道什么时候用锤子、什么时候用螺丝刀）

Tool = 食材、调料、锅碗瓢盆
Skill = 做菜的本事（知道怎么搭配、怎么调味、怎么控火候）
```

---

## 二、Skill 的设计模式

### 2.1 单步 Skill

最简单的 Skill，执行单一明确的任务。

```yaml
名称: 格式化代码
输入: 文件路径
流程:
  - 检测文件语言类型
  - 调用对应的 formatter
输出: 格式化后的代码
复杂度: 低
```

### 2.2 顺序 Skill

多个步骤按顺序执行，每步依赖上一步的结果。

```yaml
名称: 创建 REST API
输入: 需求描述
流程:
  Step 1: 解析需求，确定实体和接口
  Step 2: 创建项目目录结构
  Step 3: 定义数据模型
  Step 4: 实现业务逻辑
  Step 5: 编写路由和控制器
  Step 6: 添加输入验证
  Step 7: 编写测试
  Step 8: 运行测试验证
输出: 可运行的 API 代码
复杂度: 高
```

### 2.3 条件 Skill

根据中间结果动态调整流程。

```yaml
名称: 修复构建错误
输入: 错误日志
流程:
  Step 1: 分析错误类型
  Step 2: 根据错误类型分支
    IF 语法错误:
      → 定位错误文件和行号
      → 修复语法问题
    IF 依赖错误:
      → 检查 package.json / pom.xml
      → 更新或安装缺失依赖
    IF 类型错误:
      → 分析类型定义
      → 修复类型不匹配
    IF 未知错误:
      → 搜索类似问题
      → 尝试常见解决方案
  Step 3: 重新构建验证
输出: 修复结果
复杂度: 中
```

### 2.4 循环 Skill

反复执行直到满足条件。

```yaml
名称: 测试驱动修复
输入: 测试文件路径
流程:
  循环（最多 5 次）:
    Step 1: 运行测试
    Step 2: IF 所有通过 → 退出循环
    Step 3: 分析失败的测试
    Step 4: 定位相关源码
    Step 5: 修复代码
  END 循环
输出: 修复结果 + 测试报告
复杂度: 高
```

### 2.5 并行 Skill

多个独立步骤同时执行。

```yaml
名称: 全面代码审查
输入: 代码变更（diff）
流程:
  并行执行:
    ├── Skill A: 逻辑分析
    │   → 检查业务逻辑正确性
    ├── Skill B: 安全检查
    │   → 扫描 OWASP Top 10
    ├── Skill C: 性能分析
    │   → 检查时间/空间复杂度
    └── Skill D: 风格检查
        → 检查编码规范
  等待全部完成
  汇总结果
输出: 结构化审查报告
复杂度: 高
```

---

## 三、Skill 的标准化定义

### 3.1 Skill 接口规范

```python
from abc import ABC, abstractmethod
from typing import Any

class Skill(ABC):
    """Skill 基类"""

    @property
    @abstractmethod
    def name(self) -> str:
        """技能名称"""
        pass

    @property
    @abstractmethod
    def description(self) -> str:
        """技能描述（给 AI 看的）"""
        pass

    @property
    @abstractmethod
    def triggers(self) -> list[str]:
        """触发条件（用户说什么时激活）"""
        pass

    @property
    def tools_required(self) -> list[str]:
        """需要的工具列表"""
        return []

    @abstractmethod
    def execute(self, context: dict) -> dict:
        """执行技能，返回结果"""
        pass
```

### 3.2 Skill 注册机制

```python
class SkillRegistry:
    """技能注册中心"""

    def __init__(self):
        self.skills: dict[str, Skill] = {}

    def register(self, skill: Skill):
        self.skills[skill.name] = skill

    def find_by_trigger(self, user_message: str) -> Skill | None:
        """根据用户消息找到匹配的技能"""
        for skill in self.skills.values():
            for trigger in skill.triggers:
                if trigger in user_message:
                    return skill
        return None

    def list_skills(self) -> list[dict]:
        """列出所有可用技能"""
        return [
            {
                "name": s.name,
                "description": s.description,
                "triggers": s.triggers,
            }
            for s in self.skills.values()
        ]
```

### 3.3 具体 Skill 实现示例

```python
class CodeReviewSkill(Skill):
    """代码审查技能"""

    @property
    def name(self) -> str:
        return "code_review"

    @property
    def description(self) -> str:
        return "对代码变更进行全面审查，包括逻辑、安全、性能和风格"

    @property
    def triggers(self) -> list[str]:
        return ["代码审查", "code review", "帮我看看代码", "review"]

    @property
    def tools_required(self) -> list[str]:
        return ["read_file", "search_code", "run_command"]

    def execute(self, context: dict) -> dict:
        diff = context.get("diff", "")

        # 1. 读取相关代码
        files = self._extract_changed_files(diff)

        # 2. 并行分析
        results = {
            "logic": self._check_logic(files),
            "security": self._check_security(files),
            "performance": self._check_performance(files),
            "style": self._check_style(files),
        }

        # 3. 生成报告
        return self._generate_report(results)
```

---

## 四、Skill 在不同平台中的实现

### 4.1 Claude Code 中的 Skill

Claude Code 通过 CLAUDE.md 文件定义 Skill：

```markdown
# CLAUDE.md

## 代码审查 Skill
当用户请求代码审查时：
1. 运行 `git diff` 获取变更
2. 逐文件分析变更内容
3. 检查：
   - 是否有逻辑错误
   - 是否有安全隐患
   - 是否有性能问题
   - 是否符合项目编码规范
4. 生成结构化的审查报告

## 部署 Skill
当用户请求部署时：
1. 运行测试 `npm test`
2. 如果通过，构建 `npm run build`
3. 提交代码 `git add -A && git commit`
4. 推送 `git push`
5. 验证部署状态
```

### 4.2 Dify 中的 Skill

在 Dify 平台中，Skill 通过 Workflow 实现：

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  开始     │ →   │ LLM 节点  │ →   │ 工具节点  │
│  输入参数  │     │ 分析需求  │     │ 执行操作  │
└──────────┘     └──────────┘     └──────────┘
                                       │
                 ┌──────────┐     ┌────▼─────┐
                 │  输出     │ ←   │ LLM 节点  │
                 │  返回结果  │     │ 生成报告  │
                 └──────────┘     └──────────┘
```

### 4.3 LangChain 中的 Skill

```python
from langchain.agents import AgentExecutor, create_react_agent
from langchain.tools import Tool

# 定义 Skill 为一组 Tool 的组合
def code_review_skill(inputs):
    """代码审查 Skill"""
    diff = inputs["diff"]

    # Step 1: 分析
    analysis = llm.invoke(f"分析以下代码变更的潜在问题：\n{diff}")

    # Step 2: 安全检查
    security = llm.invoke(f"检查以下代码的安全隐患：\n{diff}")

    # Step 3: 生成报告
    report = llm.invoke(f"基于以下分析生成审查报告：\n分析：{analysis}\n安全：{security}")

    return report
```

---

## 五、Skill 的组合与编排

### 5.1 Skill 链（Chain）

多个 Skill 串联执行，前一个的输出是后一个的输入。

```
用户："帮我重构并测试这段代码"

Skill 链：
  代码分析 Skill → 重构 Skill → 测试 Skill → 报告 Skill

执行流程：
  分析代码结构 → 制定重构方案 → 执行重构 → 运行测试 → 生成报告
```

### 5.2 Skill 路由（Router）

根据用户意图，路由到不同的 Skill。

```
用户消息 → Router
              ├→ "部署" → 部署 Skill
              ├→ "测试" → 测试 Skill
              ├→ "审查" → 审查 Skill
              └→ "其他" → 通用对话
```

### 5.3 Skill 编排（Orchestration）

复杂的 Skill 组合，包含条件、循环、并行。

```
用户："帮我优化这个 API 的性能"

编排流程：
  1. 性能分析 Skill（并行）
     ├── 响应时间分析
     ├── 内存使用分析
     └── 数据库查询分析

  2. 优化决策 Skill（条件）
     IF 响应慢 → API 优化 Skill
     IF 内存高 → 内存优化 Skill
     IF 查询慢 → SQL 优化 Skill

  3. 实施优化 Skill（顺序）
     → 修改代码
     → 运行测试
     → 性能对比

  4. 结果报告 Skill
     → 生成优化前后对比报告
```

---

## 六、设计高质量 Skill 的原则

### 6.1 单一职责

```
✅ 好的设计：
  "代码格式化" Skill → 只做格式化
  "单元测试生成" Skill → 只生成测试

❌ 差的设计：
  "代码处理" Skill → 又格式化、又测试、又审查
```

### 6.2 明确的输入输出

```yaml
# 好的定义
名称: SQL 查询优化
输入:
  - sql: string        # 原始 SQL 语句
  - table_schema: string  # 表结构
输出:
  - optimized_sql: string  # 优化后的 SQL
  - explanation: string    # 优化说明
  - index_suggestions: list  # 索引建议
```

### 6.3 可组合性

```
每个 Skill 应该像乐高积木一样，能和其他 Skill 灵活组合：

Skill A（读取代码）+ Skill B（分析逻辑）+ Skill C（生成报告）
= 代码审查流程

Skill A（读取代码）+ Skill D（生成测试）+ Skill E（运行测试）
= 测试生成流程
```

### 6.4 错误处理

```python
def execute(self, context: dict) -> dict:
    try:
        # 主逻辑
        result = self._do_work(context)
        return {"status": "success", "result": result}
    except ToolTimeoutError:
        return {"status": "error", "message": "工具执行超时，请稍后重试"}
    except FileNotFoundError:
        return {"status": "error", "message": f"文件不存在: {context['file_path']}"}
    except Exception as e:
        return {"status": "error", "message": f"未知错误: {str(e)}"}
```

### 6.5 可测试性

```python
# 每个 Skill 都应该能独立测试
def test_code_review_skill():
    skill = CodeReviewSkill()
    context = {
        "diff": "def add(a, b): return a + b  # 简单测试用例"
    }
    result = skill.execute(context)

    assert result["status"] == "success"
    assert "review" in result
```

---

## 七、常见 Skill 库

### 开发类 Skill

| Skill | 功能 |
|---|---|
| 代码生成 | 根据需求生成代码 |
| 代码审查 | 分析代码质量 |
| 代码重构 | 优化代码结构 |
| 测试生成 | 自动生成测试用例 |
| Bug 修复 | 分析并修复 bug |
| 文档生成 | 自动生成 API 文档 |

### 运维类 Skill

| Skill | 功能 |
|---|---|
| 部署 | 自动化部署流程 |
| 监控 | 检查系统状态 |
| 告警处理 | 分析告警并修复 |
| 日志分析 | 从日志中提取信息 |
| 容量规划 | 预测资源需求 |

### 数据类 Skill

| Skill | 功能 |
|---|---|
| 数据清洗 | 处理脏数据 |
| 数据分析 | 统计和可视化 |
| 报告生成 | 自动生成报告 |
| ETL | 数据抽取转换加载 |

---

## 总结

Skill 是 Agent 能力的模块化封装。它不是简单的工具调用，而是包含**推理、判断、组合工具**的完整能力单元。设计好的 Skill 需要遵循单一职责、明确输入输出、可组合、可测试的原则。随着 AI 应用的发展，Skill 生态将像 App Store 一样丰富——Agent 可以按需安装技能，完成各种复杂任务。
