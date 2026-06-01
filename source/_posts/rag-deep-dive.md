---
title: RAG 让 AI 能"查资料"：检索增强生成完全指南
date: 2026-05-28 13:00:00
image: /images/covers/rag-deep-dive.svg
tags:
  - RAG
  - AI
  - 向量数据库
  - 知识库
categories:
  - AI
---

## 前言

大模型有两个致命缺陷：**知识有截止日期**和**会编造答案**。你问它公司内部的退款政策，它不知道；你问它一个不确定的事实，它可能一本正经地胡说。RAG（Retrieval Augmented Generation，检索增强生成）就是为了解决这两个问题而生的。

---

## 一、RAG 的核心思想

RAG 的思路很简单：**先查资料，再回答问题**。

```
没有 RAG：
  用户："公司的年假政策是什么？"
  AI："根据一般企业规定..."  ← 在瞎猜

有了 RAG：
  用户："公司的年假政策是什么？"
  系统：（先从知识库检索到《员工手册》相关段落）
  AI："根据《员工手册》第 3.2 节，入职满 1 年有 5 天年假..."  ← 有据可依
```

就像一个学生考试：
- 没有 RAG = 闭卷考试（全靠记忆，容易错）
- 有了 RAG = 开卷考试（可以翻书，答案更准确）

---

## 二、RAG 完整流程

### 2.1 离线阶段：建立知识库

```
文档（PDF/Word/网页）
    ↓
文本切分（Chunking）
    ↓
向量化（Embedding）
    ↓
存入向量数据库
```

**Step 1：文档加载**

```python
from langchain_community.document_loaders import PyPDFLoader, TextLoader

# 加载 PDF
loader = PyPDFLoader("employee_handbook.pdf")
docs = loader.load()

# 加载文本
loader = TextLoader("faq.txt", encoding="utf-8")
docs = loader.load()
```

**Step 2：文本切分**

为什么要切分？因为：
- 大模型有上下文限制，不能把整本书塞进去
- 检索需要精确匹配，段落太大会包含无关信息

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,       # 每块 500 字符
    chunk_overlap=50,     # 相邻块重叠 50 字符
    separators=["\n\n", "\n", "。", "！", "？", " "],
)

chunks = splitter.split_documents(docs)
```

切分策略很重要：

```
切太大（chunk_size=5000）：
  → 检索不精确，大量无关信息干扰 AI
  → 但上下文完整，AI 理解更好

切太小（chunk_size=100）：
  → 检索精确，但信息碎片化
  → AI 缺乏上下文，理解困难

推荐：300-1000 字符，根据文档特点调整
```

**Step 3：向量化（Embedding）**

把文字转换成一组数字（向量），语义相近的文字向量也相近。

```python
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# 将文本转为向量
vector = embeddings.embed_query("公司的年假政策")
# 返回：[0.023, -0.156, 0.089, ...]  （1536 维的浮点数数组）
```

为什么语义相近的文字向量也相近？

```
"退款政策"  → [0.2, 0.8, 0.1, 0.3, ...]
"退货返款"  → [0.21, 0.79, 0.12, 0.28, ...]  ← 向量很接近！

"退款政策"  → [0.2, 0.8, 0.1, 0.3, ...]
"今天天气"  → [0.7, 0.1, 0.5, 0.9, ...]  ← 向量差很远

通过计算向量之间的距离，就能判断两段文字是否"语义相关"
```

**Step 4：存入向量数据库**

```python
from langchain_community.vectorstores import Chroma

vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory="./chroma_db",  # 持久化到磁盘
)
```

### 2.2 在线阶段：检索 + 生成

```
用户提问
    ↓
问题向量化
    ↓
从向量数据库检索相似文档
    ↓
将检索到的文档 + 用户问题 → 发给大模型
    ↓
大模型根据文档生成回答
```

```python
# 检索
retriever = vectorstore.as_retriever(search_kwargs={"k": 4})
relevant_docs = retriever.invoke("年假政策是什么")

# 生成
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA

llm = ChatOpenAI(model="gpt-4o")
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=retriever,
)

result = qa_chain.invoke("年假政策是什么")
print(result["result"])
```

---

## 三、向量数据库深度解析

### 3.1 什么是向量数据库

传统数据库存的是结构化数据（数字、字符串），向量数据库存的是**高维向量**，并支持**相似度搜索**。

```
传统数据库查询：
  SELECT * FROM users WHERE age > 25   → 精确匹配

向量数据库查询：
  "找和'退款政策'最相似的 5 段文字"     → 语义匹配
```

### 3.2 主流向量数据库对比

| 数据库 | 类型 | 特点 | 适合场景 |
|---|---|---|---|
| ChromaDB | 嵌入式 | 轻量、Python 原生 | 原型开发、小项目 |
| FAISS | 库 | Facebook 开源、速度快 | 本地开发 |
| Milvus | 分布式 | 高性能、可扩展 | 生产环境 |
| Weaviate | 服务 | GraphQL API、功能丰富 | 中大型项目 |
| Pinecone | 云服务 | 全托管、零运维 | 快速上线 |
| pgvector | 扩展 | PostgreSQL 插件 | 已有 PG 的项目 |

### 3.3 相似度计算方法

```python
# 余弦相似度（最常用）
import numpy as np

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# 欧氏距离
def euclidean_distance(a, b):
    return np.linalg.norm(np.array(a) - np.array(b))

# 余弦相似度范围：[-1, 1]
# 1 = 完全相同
# 0 = 无关
# -1 = 完全相反
```

---

## 四、RAG 优化技巧

### 4.1 分块策略优化

```python
# 方案 1：按语义切分（而非固定长度）
from langchain.text_splitter import MarkdownTextSplitter

splitter = MarkdownTextSplitter(chunk_size=500, chunk_overlap=50)
# 按 Markdown 标题切分，保持语义完整性

# 方案 2：递归切分（推荐）
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    separators=["\n\n", "\n", "。", "！", "？", ".", " "],
    # 先尝试按段落切，不行再按句子切，最后按词切

# 方案 3：父子块策略
# 小块用于检索（精确匹配），大块用于生成（完整上下文）
small_splitter = RecursiveCharacterTextSplitter(chunk_size=200)
large_splitter = RecursiveCharacterTextSplitter(chunk_size=1000)
```

### 4.2 检索优化

```python
# 方案 1：混合检索（关键词 + 语义）
from langchain.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever

bm25 = BM25Retriever.from_documents(chunks)
bm25.k = 4

semantic = vectorstore.as_retriever(search_kwargs={"k": 4})

hybrid = EnsembleRetriever(
    retrievers=[bm25, semantic],
    weights=[0.3, 0.7],  # 语义检索权重更高
)

# 方案 2：重排序（Reranking）
# 先粗检索 top 20，再用模型精排取 top 4
from langchain.retrievers import ContextualCompressionRetriever
from langchain_cohere import CohereRerank

reranker = CohereRerank(model="rerank-v3.5", top_n=4)
compression_retriever = ContextualCompressionRetriever(
    base_compressor=reranker,
    base_retriever=vectorstore.as_retriever(search_kwargs={"k": 20}),
)

# 方案 3：查询改写
# 用 LLM 改写用户问题，提高检索效果
rewrite_prompt = """
请将以下用户问题改写为更适合搜索的形式，
保留关键信息，去除口语化表达：
用户问题：{question}
改写后的搜索词：
"""
```

### 4.3 生成优化

```python
# 方案 1：引用来源
prompt = """
请根据以下参考资料回答问题。
回答时必须引用信息来源（文档名和段落编号）。

参考资料：
{context}

问题：{question}

回答格式：
回答内容...
来源：《文档名》第 X 段
"""

# 方案 2：限制范围
prompt = """
你是一个知识库助手。请严格遵守以下规则：
1. 只根据提供的参考资料回答
2. 如果参考资料中没有相关信息，回答"根据现有资料，无法回答"
3. 不要编造任何信息
4. 回答要简洁准确

参考资料：{context}
问题：{question}
"""

# 方案 3：多轮追问
# 第一轮：检索相关文档
# 第二轮：让 AI 评估文档是否足够回答问题
# 第三轮：如果不够，让 AI 提出需要补充的信息
```

### 4.4 Embedding 模型选择

| 模型 | 维度 | 特点 |
|---|---|---|
| text-embedding-3-small | 1536 | OpenAI，性价比高 |
| text-embedding-3-large | 3072 | OpenAI，效果最好 |
| bge-large-zh | 1024 | 中文效果好，开源 |
| nomic-embed-text | 768 | Ollama 可用，本地部署 |
| m3e-base | 768 | 中文，轻量 |

---

## 五、RAG vs 微调 vs 长上下文

| 维度 | RAG | 微调（Fine-tuning） | 长上下文 |
|---|---|---|---|
| 成本 | 低 | 高 | 中 |
| 知识更新 | 实时 | 需要重新训练 | 每次重新输入 |
| 幻觉 | 少 | 较少 | 较少 |
| 私有数据 | 支持 | 支持 | 支持 |
| 适合场景 | 知识问答 | 专业风格/格式 | 长文档分析 |
| 实现难度 | 低 | 高 | 低 |

**选择建议：**

```
刚开始 → 先用 RAG（成本低、效果好）
需要特定风格 → 考虑微调（如法律文书风格）
需要分析超长文档 → 用长上下文模型
最佳方案 → RAG + 长上下文结合
```

---

## 六、常见问题与解决方案

### Q1：检索到的内容不相关

```
原因：
  - 切分太大或太小
  - Embedding 模型不适合
  - 用户问题太模糊

解决：
  1. 调整 chunk_size
  2. 换用更好的 Embedding 模型
  3. 用 LLM 改写用户问题
  4. 增加检索数量（top_k）
  5. 使用混合检索
```

### Q2：回答引用了错误的文档

```
原因：
  - 文档内容相似但含义不同
  - 切分破坏了上下文

解决：
  1. 增加 chunk_overlap
  2. 在 chunk 中添加元数据（标题、章节）
  3. 使用 Reranking 重排序
  4. 在 prompt 中强调引用要求
```

### Q3：文档太多，检索太慢

```
原因：
  - 向量数据库数据量大
  - Embedding 计算耗时

解决：
  1. 使用 ANN（近似最近邻）索引
  2. 分库分表（按文档类型分）
  3. 使用更快的向量数据库（Milvus）
  4. 缓存常见查询结果
```

### Q4：多语言文档处理

```
方案：
  1. 使用多语言 Embedding 模型
  2. 检索时用相同语言查询
  3. 用 LLM 翻译后再检索
  4. 为不同语言建立不同的向量库
```

---

## 七、RAG 的未来趋势

```
当前：基础 RAG
  文档 → 切分 → 向量化 → 检索 → 生成

近期：高级 RAG
  ├── 查询改写（让搜索词更精准）
  ├── 混合检索（关键词 + 语义）
  ├── 重排序（精排检索结果）
  ├── 上下文压缩（去除无关信息）
  └── 自适应检索（判断是否需要检索）

未来：Agentic RAG
  ├── Agent 自主决定检索策略
  ├── 多轮检索（不够就再搜）
  ├── 跨知识库联合检索
  └── 检索结果自动验证
```

---

## 总结

RAG 是目前最实用的 AI 增强技术。它通过"先检索、再生成"的方式，让 AI 能基于真实文档回答问题，大幅减少幻觉。核心流程是：文档加载 → 文本切分 → 向量化 → 存储 → 检索 → 生成。优化的关键在于分块策略、检索方法和提示词设计。对于大多数知识问答场景，RAG 是成本最低、效果最好的方案。
