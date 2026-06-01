---
title: Agent 让 AI 能"做"事情：智能体架构与实战
date: 2026-05-28 15:00:00
image: /images/covers/agent-deep-dive.svg
tags:
  - Agent
  - AI
  - 智能体
categories:
  - AI
---

## 前言

大模型只能"想"，不能"做"。你问它今天的天气，它说不知道；你让它帮你发邮件，它说做不到。Agent（智能体）就是解决这个问题的——给 AI 装上手和脚，让它能**自主感知环境、调用工具、执行任务**。

---

## 一、Agent 的核心循环

一个 Agent 的工作流程是一个不断循环的过程：

```
感知（Perceive）
  → 接收用户输入、读取环境信息
    ↓
思考（Think）
  → 分析任务、制定计划
    ↓
行动（Act）
  → 调用工具、执行操作
    ↓
观察（Observe）
  → 检查结果、判断是否完成
    ↓
回到"思考"，继续下一轮，直到任务完成
```

### 具体例子

```
用户："帮我查看服务器上的磁盘使用率，如果超过 80% 就清理日志"

第 1 轮：
  感知：用户要我检查磁盘并可能清理日志
  思考：先查看磁盘使用率
  行动：调用 execute_command("df -h")
  观察：根分区使用率 85%，超过 80%

第 2 轮：
  思考：需要清理日志，先看看哪些日志占空间
  行动：调用 execute_command("du -sh /var/log/*")
  观察：/var/log/app/ 占了 12GB

第 3 轮：
  思考：清理 30 天前的日志
  行动：调用 execute_command("find /var/log/app -mtime +30 -delete")
  观察：清理完成，释放了 8GB

第 4 轮：
  思考：再检查一次磁盘
  行动：调用 execute_command("df -h")
  观察：根分区降到 72%，问题解决

返回结果："已清理过期日志，磁盘使用率从 85% 降至 72%。"
```

---

## 二、Agent 的四大核心能力

### 2.1 工具调用（Tool Use）

工具是 Agent 与外部世界交互的接口。

```python
# 定义工具列表
tools = [
    {
        "name": "read_file",
        "description": "读取指定路径的文件内容",
        "parameters": {
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "文件的绝对路径"
                }
            },
            "required": ["file_path"]
        }
    },
    {
        "name": "write_file",
        "description": "将内容写入指定文件",
        "parameters": {
            "type": "object",
            "properties": {
                "file_path": {"type": "string"},
                "content": {"type": "string"}
            },
            "required": ["file_path", "content"]
        }
    },
    {
        "name": "execute_command",
        "description": "执行 shell 命令",
        "parameters": {
            "type": "object",
            "properties": {
                "command": {"type": "string"}
            },
            "required": ["command"]
        }
    },
    {
        "name": "search_web",
        "description": "搜索互联网",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string"}
            },
            "required": ["query"]
        }
    },
]
```

### 2.2 规划能力（Planning）

Agent 能把模糊的需求拆成具体的步骤。

```
用户需求："帮我搭建一个 REST API"

Agent 的规划：
  ┌─────────────────────────────────────────┐
  │ Plan: 搭建 REST API                      │
  ├─────────────────────────────────────────┤
  │ Step 1: 创建项目目录和虚拟环境            │
  │ Step 2: 安装 Flask 依赖                  │
  │ Step 3: 创建 app.py 主文件                │
  │ Step 4: 定义 User 模型                    │
  │ Step 5: 实现 CRUD 接口                    │
  │ Step 6: 添加输入验证                      │
  │ Step 7: 编写测试用例                      │
  │ Step 8: 运行测试验证                      │
  └─────────────────────────────────────────┘
```

### 2.3 记忆系统（Memory）

```
短期记忆（当前对话）
  ├── 用户刚才说了什么
  ├── 我执行了哪些操作
  └── 中间结果是什么

长期记忆（跨对话持久化）
  ├── 用户偏好（用 Python 还是 Java）
  ├── 项目信息（技术栈、目录结构）
  └── 过去的经验（哪些方案有效）

工作记忆（当前任务状态）
  ├── 待办列表（Plan）
  ├── 已完成的步骤
  └── 中间产物
```

### 2.4 反思能力（Reflection）

```
执行结果不理想时，Agent 会反思：

尝试 1：用 requests 库调用 API → 超时
  反思：可能是网络问题，增加超时时间重试

尝试 2：增加 timeout=30 → 返回 500 错误
  反思：服务端问题，检查 API 文档是否有新版本

尝试 3：切换到 v2 API → 成功
  总结：API 已升级到 v2，旧版本不再可用
```

---

## 三、Agent 架构模式

### 3.1 ReAct 模式

最经典的 Agent 架构，交替进行推理（Reasoning）和行动（Acting）。

```
Thought: 用户想查看服务器状态，我需要先 SSH 连接
Action: execute_command("ssh user@server 'uptime && df -h'")
Observation: 连接成功，服务器正常运行 120 天，磁盘使用 45%
Thought: 服务器状态正常，现在检查应用日志是否有错误
Action: execute_command("ssh user@server 'tail -100 /var/log/app.log | grep ERROR'")
Observation: 最近 24 小时有 3 条 ERROR，都是连接超时
Thought: 发现了问题，总结报告给用户
Answer: 服务器运行正常，但最近 24 小时有 3 次连接超时错误。
```

### 3.2 Plan-and-Execute 模式

先制定完整计划，再逐步执行。

```
Phase 1: Plan（规划）
  输入："重构用户认证模块"
  输出：
    1. 分析现有认证代码
    2. 设计新的认证架构
    3. 实现 JWT Token 机制
    4. 替换旧的 Session 认证
    5. 更新相关测试
    6. 集成测试验证

Phase 2: Execute（执行）
  逐步执行每个计划...

Phase 3: Replan（重新规划，如果需要）
  执行中发现需要额外步骤 → 更新计划
```

### 3.3 Multi-Agent 模式

多个专业 Agent 协作完成复杂任务。

```
用户："帮我做一个完整的代码审查"

                    ┌─ Coder Agent（代码分析）
                    │    → 分析代码逻辑
                    │    → 检查变量命名
                    │    → 评估代码复杂度
                    │
Planner Agent ──────┼─ Security Agent（安全检查）
  （制定审查计划）   │    → 扫描 SQL 注入
                    │    → 检查 XSS 风险
                    │    → 审查权限控制
                    │
                    ├─ Performance Agent（性能分析）
                    │    → 分析时间复杂度
                    │    → 检查内存泄漏风险
                    │    → 评估并发安全
                    │
                    └─ Report Agent（报告生成）
                         → 汇总所有发现
                         → 生成结构化报告
```

---

## 四、实战：构建一个简单的 Agent

### 4.1 完整代码

```python
import json
from openai import OpenAI

client = OpenAI()

# 定义工具
tools = [
    {
        "type": "function",
        "function": {
            "name": "execute_command",
            "description": "执行 shell 命令并返回输出",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {"type": "string", "description": "要执行的 shell 命令"}
                },
                "required": ["command"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "读取文件内容",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "文件路径"}
                },
                "required": ["path"]
            }
        }
    },
]

# 工具实现
def execute_command(command):
    import subprocess
    result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=30)
    return result.stdout or result.stderr

def read_file(path):
    with open(path, "r") as f:
        return f.read()

# Agent 主循环
def run_agent(user_message, max_rounds=10):
    messages = [
        {"role": "system", "content": "你是一个有用的助手，可以执行命令和读取文件来帮助用户。"},
        {"role": "user", "content": user_message},
    ]

    for round_num in range(max_rounds):
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            tools=tools,
        )

        msg = response.choices[0].message

        # 如果模型不需要调用工具，直接返回回答
        if not msg.tool_calls:
            return msg.content

        # 处理工具调用
        messages.append(msg)
        for tool_call in msg.tool_calls:
            func_name = tool_call.function.name
            args = json.loads(tool_call.function.arguments)

            if func_name == "execute_command":
                result = execute_command(args["command"])
            elif func_name == "read_file":
                result = read_file(args["path"])
            else:
                result = f"Unknown tool: {func_name}"

            print(f"  [Tool] {func_name}({args}) → {result[:200]}")

            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": result,
            })

    return "达到最大轮次，任务未完成"

# 使用
answer = run_agent("查看当前目录有哪些 Python 文件，以及它们的总行数")
print(answer)
```

### 4.2 运行效果

```
用户：查看当前目录有哪些 Python 文件，以及它们的总行数

  [Tool] execute_command({'command': 'find . -name "*.py"'}) → ./app.py\n./utils.py\n./config.py
  [Tool] execute_command({'command': 'wc -l ./app.py ./utils.py ./config.py'}) →   45 ./app.py\n  120 ./utils.py\n  30 ./config.py\n  195 total

AI：当前目录有 3 个 Python 文件：
  - app.py：45 行
  - utils.py：120 行
  - config.py：30 行
  总计：195 行
```

---

## 五、Claude Code：Agent 的最佳实践

Claude Code 是 Anthropic 推出的命令行 Agent，也是 Agent 架构的典型代表。

### 它能做什么

```
✅ 读写文件
✅ 执行终端命令
✅ 搜索代码库
✅ 编辑代码
✅ Git 操作
✅ 创建 PR
✅ 运行测试
✅ 自主规划和执行复杂任务
```

### Agent 架构

```
用户输入："给这个项目添加单元测试"

Claude Code 内部流程：
  1. 感知：读取项目结构、技术栈
  2. 规划：确定需要测试的模块、测试框架
  3. 行动：
     - 读取源码文件
     - 分析函数签名和逻辑
     - 编写测试代码
     - 运行测试命令
  4. 观察：检查测试结果
  5. 反思：如果有失败的测试，分析原因并修复
  6. 返回：报告测试覆盖情况
```

---

## 六、Agent 的安全考量

### 权限控制

```
危险操作需要确认：
  ├── 删除文件        → 需要用户确认
  ├── 推送代码        → 需要用户确认
  ├── 安装依赖        → 需要用户确认
  └── 修改系统配置    → 需要用户确认

安全操作可以自动执行：
  ├── 读取文件        → 自动
  ├── 搜索代码        → 自动
  ├── 运行测试        → 自动
  └── 生成代码        → 自动
```

### 常见风险

```
1. 命令注入：AI 生成的命令可能包含恶意操作
2. 文件泄露：AI 可能读取敏感文件（.env、密钥）
3. 无限循环：AI 可能陷入反复尝试的死循环
4. 资源消耗：大量 API 调用产生费用
```

### 防护措施

```
1. 沙箱隔离：在容器中运行 Agent
2. 权限最小化：只给必要的权限
3. 操作审计：记录所有工具调用
4. 超时限制：设置最大执行时间和轮次
5. 费用监控：设置 API 调用预算
```

---

## 七、Agent 的发展趋势

```
当前：人类监督下的 Agent
  - 每步操作都需要人类确认
  - Agent 是"助手"，人类是"主导"

近期：人类监督下的自主 Agent
  - 关键操作确认，常规操作自动
  - Agent 能独立完成简单任务

未来：高度自主的 Agent
  - Agent 能独立处理复杂项目
  - 人类只负责定义目标和审查结果
  - 多 Agent 协作成为常态
```

---

## 总结

Agent 是让 AI 从"想"到"做"的关键。它通过工具调用获得操作能力，通过规划能力处理复杂任务，通过记忆系统保持上下文连贯，通过反思能力不断优化。理解 Agent 的核心循环（感知→思考→行动→观察→反思）和架构模式（ReAct / Plan-and-Execute / Multi-Agent），是构建 AI 应用的基础。
