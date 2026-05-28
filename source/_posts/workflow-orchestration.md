---
title: 工作流编排让多个 AI 协同工作：架构与实战
date: 2026-05-28 11:10:00
tags:
  - 工作流
  - AI
  - 编排
  - 多Agent
categories:
  - 技术
---

## 前言

一个 Agent 能做很多事，但面对复杂任务时，单打独斗不如团队协作。工作流编排（Workflow Orchestration）就是让多个 AI Agent 按照一定的规则协同工作，像一支训练有素的团队。

---

## 一、为什么需要编排

### 1.1 单 Agent 的局限

```
单 Agent 处理"帮我做一个完整的项目"：

  接到任务 → 一个人干所有事 → 容易出错、效率低、质量一般

  就像一个人既要当产品经理、又要当开发、又要当测试、又要当运维
```

### 1.2 多 Agent 协作

```
多 Agent 处理同一个任务：

  Planner Agent   → 制定项目计划
  Coder Agent     → 编写代码
  Tester Agent    → 编写和运行测试
  Reviewer Agent  → 代码审查
  Deployer Agent  → 部署上线

  各司其职，像一支分工明确的团队
```

---

## 二、四种基本编排模式

### 2.1 顺序执行（Sequential）

像工厂流水线，一个接一个。

```
Task A → Task B → Task C → 最终结果
```

**适用场景：**
- 有明确先后依赖的任务
- 前一步的输出是后一步的输入

**示例：代码生成流程**

```
需求分析 → 架构设计 → 代码编写 → 测试 → 部署
```

**实现代码：**

```python
def sequential_workflow(user_request):
    # Step 1: 需求分析
    analysis = planner_agent.analyze(user_request)

    # Step 2: 架构设计（依赖 Step 1 的结果）
    architecture = architect_agent.design(analysis)

    # Step 3: 代码编写（依赖 Step 2 的结果）
    code = coder_agent.implement(architecture)

    # Step 4: 测试（依赖 Step 3 的结果）
    test_result = tester_agent.test(code)

    # Step 5: 部署（依赖 Step 4 通过）
    if test_result.passed:
        deployer_agent.deploy(code)

    return {
        "analysis": analysis,
        "code": code,
        "test_result": test_result,
    }
```

### 2.2 并行执行（Parallel）

像多人同时工作，最后汇总。

```
         ┌→ Task A ─┐
Task In →├→ Task B ─├→ Merge → 结果
         └→ Task C ─┘
```

**适用场景：**
- 多个独立任务可以同时进行
- 需要汇总多方面的分析结果

**示例：全面代码审查**

```
         ┌→ 逻辑分析 ─────┐
代码变更 →├→ 安全检查 ─────├→ 汇总报告
         ├→ 性能分析 ─────┤
         └→ 风格检查 ─────┘
```

**实现代码：**

```python
import asyncio

async def parallel_review(code_diff):
    # 并行执行四个审查任务
    results = await asyncio.gather(
        logic_agent.analyze(code_diff),
        security_agent.scan(code_diff),
        performance_agent.profile(code_diff),
        style_agent.check(code_diff),
    )

    logic_result, security_result, perf_result, style_result = results

    # 汇总结果
    report = report_agent.generate(
        logic=logic_result,
        security=security_result,
        performance=perf_result,
        style=style_result,
    )

    return report
```

### 2.3 条件分支（Conditional）

根据条件走不同路线。

```
              ┌→ 条件 1 → Task A →
判断条件 →    ├→ 条件 2 → Task B →  汇总
              └→ 条件 3 → Task C →
```

**适用场景：**
- 根据输入类型选择不同处理方式
- 根据中间结果决定下一步操作

**示例：智能客服分流**

```
用户提问 → 意图识别
              ├→ 技术问题 → 技术支持 Agent + 技术文档 RAG
              ├→ 退款问题 → 退款处理 Agent + 退款政策 RAG
              ├→ 投诉问题 → 投诉处理 Agent（安抚 + 转人工）
              └→ 其他     → 通用客服 Agent
```

**实现代码：**

```python
def conditional_workflow(user_message):
    # Step 1: 意图识别
    intent = router_agent.classify(user_message)

    # Step 2: 根据意图分流
    if intent == "technical":
        result = technical_agent.handle(user_message, rag="tech_docs")
    elif intent == "refund":
        result = refund_agent.handle(user_message, rag="refund_policy")
    elif intent == "complaint":
        result = complaint_agent.handle(user_message)
        if result.needs_human:
            transfer_to_human(user_message)
    else:
        result = general_agent.handle(user_message)

    return result
```

### 2.4 循环执行（Loop）

反复执行直到满足条件。

```
循环：
  Task → 检查结果
         ├→ 不满足 → 回到 Task
         └→ 满足 → 返回结果
```

**适用场景：**
- 代码修复（测试不通过就继续修）
- 迭代优化（质量不达标就继续优化）
- 搜索（没找到就换策略继续搜）

**示例：自动修复代码**

```
循环（最多 5 次）：
  运行测试
    ├→ 全部通过 → 完成
    └→ 有失败   → 分析错误 → 修复代码 → 继续循环
```

**实现代码：**

```python
def loop_fix_workflow(code, max_attempts=5):
    for attempt in range(max_attempts):
        # 运行测试
        test_result = tester_agent.run_tests(code)

        if test_result.all_passed:
            return {"status": "success", "code": code, "attempts": attempt + 1}

        # 分析失败原因
        error_analysis = analyzer_agent.analyze_failures(test_result.failures)

        # 修复代码
        code = fixer_agent.fix(code, error_analysis)

    return {"status": "max_attempts_reached", "code": code, "attempts": max_attempts}
```

---

## 三、编排框架实战

### 3.1 LangGraph 实现

LangGraph 是 LangChain 生态中的工作流编排框架，基于图结构。

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict

# 定义状态
class WorkflowState(TypedDict):
    user_request: str
    analysis: str
    code: str
    test_result: str
    status: str

# 定义节点函数
def analyze(state):
    result = llm.invoke(f"分析需求：{state['user_request']}")
    return {"analysis": result.content, "status": "analyzed"}

def write_code(state):
    result = llm.invoke(f"根据分析写代码：{state['analysis']}")
    return {"code": result.content, "status": "coded"}

def run_tests(state):
    result = llm.invoke(f"为以下代码写测试：\n{state['code']}")
    return {"test_result": result.content, "status": "tested"}

def should_fix(state):
    if "FAIL" in state["test_result"]:
        return "fix"
    return "end"

def fix_code(state):
    result = llm.invoke(f"修复以下代码的测试失败：\n代码：{state['code']}\n错误：{state['test_result']}")
    return {"code": result.content, "status": "fixed"}

# 构建工作流图
workflow = StateGraph(WorkflowState)

# 添加节点
workflow.add_node("analyze", analyze)
workflow.add_node("code", write_code)
workflow.add_node("test", run_tests)
workflow.add_node("fix", fix_code)

# 添加边
workflow.set_entry_point("analyze")
workflow.add_edge("analyze", "code")
workflow.add_edge("code", "test")
workflow.add_conditional_edges("test", should_fix, {"fix": "fix", "end": END})
workflow.add_edge("fix", "test")

# 编译并运行
app = workflow.compile()
result = app.invoke({"user_request": "写一个计算斐波那契数列的函数"})
```

### 3.2 Dify 可视化编排

Dify 是一个低代码 AI 应用平台，支持可视化拖拽编排。

```
┌─────────────────────────────────────────────────┐
│  Dify Workflow Editor                            │
│                                                  │
│  ┌────────┐   ┌────────┐   ┌────────┐          │
│  │  开始   │ → │ LLM    │ → │ 条件   │          │
│  │  输入   │   │ 分类   │   │ 判断   │          │
│  └────────┘   └────────┘   └───┬────┘          │
│                            ┌───┴────┐           │
│                       ┌────▼──┐ ┌───▼────┐      │
│                       │ LLM   │ │ LLM    │      │
│                       │ 技术   │ │ 通用   │      │
│                       └────┬──┘ └───┬────┘      │
│                        ┌───┴────┐               │
│                        │  输出   │               │
│                        └────────┘               │
└─────────────────────────────────────────────────┘
```

### 3.3 纯 Python 实现

不依赖框架，用 Python 原生实现。

```python
from dataclasses import dataclass
from typing import Callable
from enum import Enum

class NodeType(Enum):
    NORMAL = "normal"
    CONDITIONAL = "conditional"
    PARALLEL = "parallel"

@dataclass
class WorkflowNode:
    name: str
    func: Callable
    node_type: NodeType = NodeType.NORMAL
    next_nodes: list = None

class Workflow:
    def __init__(self):
        self.nodes: dict[str, WorkflowNode] = {}
        self.start_node: str = None

    def add_node(self, node: WorkflowNode):
        self.nodes[node.name] = node

    def set_start(self, name: str):
        self.start_node = name

    def run(self, initial_state: dict) -> dict:
        state = initial_state
        current = self.start_node

        while current and current != "END":
            node = self.nodes[current]
            result = node.func(state)
            state.update(result)

            if node.node_type == NodeType.CONDITIONAL:
                current = result.get("next", "END")
            else:
                current = node.next_nodes[0] if node.next_nodes else "END"

        return state

# 使用
workflow = Workflow()
workflow.add_node(WorkflowNode("analyze", analyze_func, next_nodes=["code"]))
workflow.add_node(WorkflowNode("code", code_func, next_nodes=["test"]))
workflow.add_node(WorkflowNode("test", test_func, NodeType.CONDITIONAL))
workflow.set_start("analyze")

result = workflow.run({"request": "写一个排序函数"})
```

---

## 四、实战案例

### 4.1 智能写作工作流

```
用户输入主题
    ↓
┌─ Research Agent（调研）
│   → 搜索相关资料
│   → 整理关键信息
│
├─ Outline Agent（大纲）
│   → 根据调研结果生成文章大纲
│
├─ Writer Agent（写作）
│   → 按大纲逐段写作
│
├─ Editor Agent（编辑）
│   → 检查语法和逻辑
│   → 优化表达
│
└─ Review Agent（审阅）
    → 最终审阅
    → 输出成品
```

### 4.2 自动化测试工作流

```
代码变更
    ↓
┌─ Analyzer Agent（分析）
│   → 识别变更影响范围
│   → 确定需要测试的模块
│
├─ Test Generator Agent（测试生成）
│   → 为每个变更模块生成测试用例
│
├─ Test Runner Agent（测试执行）
│   → 运行新生成的测试
│   → 运行回归测试
│
├─ Bug Detector Agent（Bug 检测）
│   → 分析测试失败原因
│   → 定位 Bug 位置
│
└─ Fixer Agent（修复）
    → 自动修复简单 Bug
    → 复杂 Bug 生成修复建议
```

### 4.3 数据分析工作流

```
用户："分析上个月的销售数据"

┌─ Data Loader Agent（数据加载）
│   → 连接数据库
│   → 提取上月销售数据
│
├─ Cleaner Agent（数据清洗）
│   → 处理缺失值
│   → 去除异常值
│
├─ Statistic Agent（统计分析）
│   → 计算关键指标（总额、均值、增长率）
│   → 按维度分组统计
│
├─ Insight Agent（洞察发现）
│   → 发现数据中的趋势和异常
│   → 提出可能的原因
│
└─ Report Agent（报告生成）
    → 生成图文并茂的分析报告
    → 给出业务建议
```

---

## 五、编排最佳实践

### 5.1 错误处理

```python
def robust_node(func):
    """包装节点，添加重试和错误处理"""
    def wrapper(state, max_retries=3):
        for attempt in range(max_retries):
            try:
                return func(state)
            except Exception as e:
                if attempt == max_retries - 1:
                    return {"error": str(e), "status": "failed"}
                time.sleep(2 ** attempt)  # 指数退避
    return wrapper
```

### 5.2 状态管理

```python
# 每个节点的输出都应该合并到全局状态
# 状态应该是可序列化的，方便持久化和调试

@dataclass
class WorkflowState:
    # 输入
    user_request: str

    # 中间结果
    analysis: dict = None
    code: str = None
    test_result: dict = None

    # 元信息
    current_step: str = ""
    history: list = field(default_factory=list)
    errors: list = field(default_factory=list)

    def log(self, step: str, result: any):
        self.history.append({
            "step": step,
            "result": str(result)[:200],
            "timestamp": time.time(),
        })
        self.current_step = step
```

### 5.3 超时控制

```python
import signal

class TimeoutError(Exception):
    pass

def with_timeout(seconds):
    def decorator(func):
        def wrapper(*args, **kwargs):
            def handler(signum, frame):
                raise TimeoutError(f"执行超时 ({seconds}s)")
            signal.signal(signal.SIGALRM, handler)
            signal.alarm(seconds)
            try:
                result = func(*args, **kwargs)
            finally:
                signal.alarm(0)
            return result
        return wrapper
    return decorator

@with_timeout(60)
def slow_agent_task(state):
    # 如果超过 60 秒，自动中断
    ...
```

### 5.4 可观测性

```python
def log_node_execution(node_name, state, result, duration):
    """记录每个节点的执行情况"""
    log_entry = {
        "node": node_name,
        "input_keys": list(state.keys()),
        "output_keys": list(result.keys()),
        "duration_ms": duration * 1000,
        "token_usage": result.get("_token_usage", {}),
    }
    print(f"[{node_name}] {duration:.2f}s")
    return log_entry
```

---

## 六、编排工具对比

| 工具 | 类型 | 特点 | 适合 |
|---|---|---|---|
| LangGraph | 代码框架 | 灵活、图结构 | 复杂自定义流程 |
| Dify | 可视化平台 | 低代码、拖拽 | 快速搭建 |
| Coze/扣子 | 可视化平台 | 中文友好 | 国内项目 |
| CrewAI | 代码框架 | 角色分工 | 多 Agent 协作 |
| Temporal | 通用编排 | 可靠、持久 | 企业级 |

---

## 总结

工作流编排是将多个 AI Agent 组合成高效团队的关键技术。四种基本模式——顺序、并行、条件、循环——可以组合出任意复杂的流程。选择合适的编排工具，设计合理的错误处理和状态管理，就能构建出稳定可靠的 AI 工作流系统。从简单的两步流程开始，逐步扩展到复杂的多 Agent 协作，是学习编排的最佳路径。
