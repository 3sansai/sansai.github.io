---
title: AI 项目实战：从零搭建 RAG 知识库问答系统
date: 2026-05-28 11:00:00
tags:
  - AI
  - RAG
  - 实战
  - Python
  - 项目
categories:
  - 技术
---

## 前言

学了 AI 概念之后，最重要的是**动手做项目**。本文带你从零搭建一个完整的 **RAG 知识库问答系统**——用户上传文档，AI 基于文档内容回答问题。

这是一个真实可用的项目，可以应用于：
- 企业内部知识问答
- 产品文档智能客服
- 技术文档助手
- 学习笔记问答

---

## 一、项目概览

### 1.1 最终效果

```
用户：公司的年假政策是什么？
AI：  根据《员工手册》第 3.2 节，公司年假政策如下：
      - 入职满 1 年：5 天年假
      - 入职满 3 年：10 天年假
      - 入职满 10 年：15 天年假
      年假需提前 3 天申请，部门经理审批。

用户：年假可以累积到下一年吗？
AI：  根据《员工手册》第 3.2.1 条，年假不可跨年累积，
      未使用的年假将在每年 12 月 31 日清零。
      特殊情况需总经理特批。
```

### 1.2 技术架构

```
┌─────────────────────────────────────────────────┐
│                    前端界面                       │
│              Streamlit Web UI                    │
├─────────────────────────────────────────────────┤
│                  应用层                          │
│          Python + LangChain                      │
├─────────────────────────────────────────────────┤
│               RAG 核心引擎                       │
│  文档加载 → 文本切分 → 向量化 → 检索 → 生成       │
├─────────────────────────────────────────────────┤
│                存储层                            │
│  ChromaDB（向量数据库）                          │
├─────────────────────────────────────────────────┤
│                模型层                            │
│  OpenAI API / 本地模型                           │
└─────────────────────────────────────────────────┘
```

### 1.3 技术栈

| 组件 | 技术选型 | 说明 |
|---|---|---|
| 编程语言 | Python 3.10+ | AI 开发首选 |
| AI 框架 | LangChain | 最流行的 AI 应用框架 |
| 向量数据库 | ChromaDB | 轻量级，适合入门 |
| 大模型 | OpenAI API | 也可替换为其他模型 |
| 前端 | Streamlit | 快速搭建 Web UI |
| 文档解析 | Unstructured | 支持多种文档格式 |

---

## 二、环境搭建

### 2.1 创建项目

```bash
mkdir rag-knowledge-base
cd rag-knowledge-base
python -m venv venv
source venv/bin/activate  # Mac/Linux
# venv\Scripts\activate   # Windows
```

### 2.2 安装依赖

```bash
pip install langchain langchain-openai langchain-community
pip install chromadb
pip install unstructured
pip install streamlit
pip install python-dotenv
pip install tiktoken
```

### 2.3 配置环境变量

```bash
# .env
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
# 如果用国内代理：
# OPENAI_BASE_URL=https://api.openai-proxy.com/v1
```

---

## 三、核心代码实现

### 3.1 项目结构

```
rag-knowledge-base/
├── app.py                  # Streamlit 主界面
├── rag_engine.py           # RAG 核心引擎
├── document_loader.py      # 文档加载器
├── config.py               # 配置管理
├── .env                    # 环境变量
├── documents/              # 上传的文档存放目录
└── requirements.txt        # 依赖列表
```

### 3.2 配置管理（config.py）

```python
import os
from dotenv import load_dotenv

load_dotenv()

# 模型配置
LLM_MODEL = "gpt-4o-mini"           # 可替换为其他模型
LLM_TEMPERATURE = 0.3                # 低温度，回答更稳定
EMBEDDING_MODEL = "text-embedding-3-small"  # 向量化模型

# 文档处理配置
CHUNK_SIZE = 500                     # 每个文本块的大小（字符数）
CHUNK_OVERLAP = 50                   # 文本块之间的重叠字符数

# 检索配置
RETRIEVAL_TOP_K = 4                  # 检索最相关的 4 个文本块

# 存储配置
CHROMA_PERSIST_DIR = "./chroma_db"   # 向量数据库持久化目录
DOCUMENT_DIR = "./documents"         # 文档存放目录

# API 配置
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
```

### 3.3 文档加载器（document_loader.py）

```python
import os
from langchain_community.document_loaders import (
    TextLoader,
    PyPDFLoader,
    Docx2txtLoader,
    CSVLoader,
)
from langchain.text_splitter import RecursiveCharacterTextSplitter
from config import CHUNK_SIZE, CHUNK_OVERLAP


def load_document(file_path: str):
    """根据文件类型加载文档"""
    ext = os.path.splitext(file_path)[1].lower()

    loaders = {
        ".txt": lambda p: TextLoader(p, encoding="utf-8"),
        ".pdf": lambda p: PyPDFLoader(p),
        ".docx": lambda p: Docx2txtLoader(p),
        ".csv": lambda p: CSVLoader(p),
    }

    loader_fn = loaders.get(ext)
    if not loader_fn:
        raise ValueError(f"不支持的文件格式: {ext}")

    loader = loader_fn(file_path)
    return loader.load()


def split_documents(docs, chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP):
    """将文档切分成小块"""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", "。", "！", "？", ".", "!", "?", " "],
    )
    return splitter.split_documents(docs)


def process_document(file_path: str):
    """完整流程：加载 → 切分"""
    docs = load_document(file_path)
    chunks = split_documents(docs)

    # 为每个 chunk 添加来源信息
    for chunk in chunks:
        chunk.metadata["source"] = os.path.basename(file_path)

    return chunks
```

### 3.4 RAG 核心引擎（rag_engine.py）

```python
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from config import (
    LLM_MODEL, LLM_TEMPERATURE, EMBEDDING_MODEL,
    RETRIEVAL_TOP_K, CHROMA_PERSIST_DIR,
    OPENAI_API_KEY, OPENAI_BASE_URL,
)


class RAGEngine:
    """RAG 知识库问答引擎"""

    def __init__(self):
        # 初始化 Embedding 模型
        self.embeddings = OpenAIEmbeddings(
            model=EMBEDDING_MODEL,
            openai_api_key=OPENAI_API_KEY,
            openai_api_base=OPENAI_BASE_URL,
        )

        # 初始化 LLM
        self.llm = ChatOpenAI(
            model=LLM_MODEL,
            temperature=LLM_TEMPERATURE,
            openai_api_key=OPENAI_API_KEY,
            openai_api_base=OPENAI_BASE_URL,
        )

        # 初始化向量数据库
        self.vectorstore = Chroma(
            persist_directory=CHROMA_PERSIST_DIR,
            embedding_function=self.embeddings,
        )

        # 自定义提示词模板
        self.prompt = PromptTemplate(
            template="""你是一个专业的知识库助手。请根据以下参考资料回答用户的问题。

规则：
1. 只根据提供的参考资料回答，不要编造信息
2. 如果参考资料中没有相关信息，请明确说"根据现有资料，我无法回答这个问题"
3. 回答时请引用信息来源（文档名）
4. 回答要简洁、准确、有条理

参考资料：
{context}

用户问题：{question}

回答：""",
            input_variables=["context", "question"],
        )

        # 构建 QA 链
        self.qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=self.vectorstore.as_retriever(
                search_kwargs={"k": RETRIEVAL_TOP_K}
            ),
            chain_type_kwargs={"prompt": self.prompt},
            return_source_documents=True,
        )

    def add_documents(self, chunks):
        """将文档块添加到向量数据库"""
        self.vectorstore.add_documents(chunks)
        self.vectorstore.persist()

    def query(self, question: str) -> dict:
        """查询并返回答案和来源"""
        result = self.qa_chain.invoke({"query": question})

        # 提取来源信息
        sources = []
        for doc in result["source_documents"]:
            source = doc.metadata.get("source", "未知")
            page = doc.metadata.get("page", "")
            if source not in sources:
                sources.append(source)

        return {
            "answer": result["result"],
            "sources": sources,
        }

    def get_document_count(self) -> int:
        """获取知识库中的文档块数量"""
        collection = self.vectorstore._collection
        return collection.count()

    def clear(self):
        """清空知识库"""
        self.vectorstore._collection.delete(
            ids=self.vectorstore._collection.get()["ids"]
        )
```

### 3.5 Streamlit 前端界面（app.py）

```python
import streamlit as st
import os
import tempfile
from rag_engine import RAGEngine
from document_loader import process_document
from config import DOCUMENT_DIR

# 页面配置
st.set_page_config(
    page_title="RAG 知识库问答系统",
    page_icon="📚",
    layout="wide",
)

st.title("📚 RAG 知识库问答系统")
st.caption("上传文档，AI 基于文档内容回答问题")

# 初始化 RAG 引擎（缓存）
@st.cache_resource
def init_rag():
    os.makedirs(DOCUMENT_DIR, exist_ok=True)
    return RAGEngine()

rag = init_rag()

# 侧边栏：文档管理
with st.sidebar:
    st.header("📁 文档管理")

    # 文件上传
    uploaded_files = st.file_uploader(
        "上传文档",
        type=["txt", "pdf", "docx", "csv"],
        accept_multiple_files=True,
    )

    if uploaded_files:
        if st.button("📥 导入文档"):
            progress = st.progress(0)
            for i, file in enumerate(uploaded_files):
                # 保存文件
                file_path = os.path.join(DOCUMENT_DIR, file.name)
                with open(file_path, "wb") as f:
                    f.write(file.getvalue())

                # 处理文档
                with st.spinner(f"处理 {file.name}..."):
                    chunks = process_document(file_path)
                    rag.add_documents(chunks)
                    st.success(f"✅ {file.name}：{len(chunks)} 个文本块已导入")

                progress.progress((i + 1) / len(uploaded_files))

            st.balloons()

    # 知识库状态
    st.divider()
    doc_count = rag.get_document_count()
    st.metric("知识库文本块数", doc_count)

    # 清空知识库
    if st.button("🗑️ 清空知识库", type="secondary"):
        rag.clear()
        st.success("知识库已清空")
        st.rerun()

    # 使用说明
    st.divider()
    st.markdown("""
    ### 使用说明
    1. 上传文档（支持 txt/pdf/docx/csv）
    2. 点击"导入文档"
    3. 在右侧输入问题
    4. AI 会基于文档内容回答

    ### 支持的文档格式
    - `.txt` 纯文本
    - `.pdf` PDF 文档
    - `.docx` Word 文档
    - `.csv` 表格数据
    """)

# 主界面：对话
st.header("💬 知识问答")

# 初始化对话历史
if "messages" not in st.session_state:
    st.session_state.messages = []

# 显示历史消息
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])
        if "sources" in msg and msg["sources"]:
            with st.expander("📎 信息来源"):
                for src in msg["sources"]:
                    st.write(f"- {src}")

# 用户输入
if question := st.chat_input("请输入你的问题..."):
    # 显示用户消息
    st.session_state.messages.append({"role": "user", "content": question})
    with st.chat_message("user"):
        st.markdown(question)

    # AI 回答
    with st.chat_message("assistant"):
        with st.spinner("思考中..."):
            if rag.get_document_count() == 0:
                answer = "⚠️ 知识库为空，请先上传文档。"
                sources = []
            else:
                result = rag.query(question)
                answer = result["answer"]
                sources = result["sources"]

            st.markdown(answer)

            if sources:
                with st.expander("📎 信息来源"):
                    for src in sources:
                        st.write(f"- {src}")

    # 保存到历史
    st.session_state.messages.append({
        "role": "assistant",
        "content": answer,
        "sources": sources,
    })
```

---

## 四、运行与测试

### 4.1 启动应用

```bash
streamlit run app.py
```

浏览器自动打开 `http://localhost:8501`。

### 4.2 测试流程

**Step 1：准备测试文档**

创建一个 `test-doc.txt`：

```
公司员工手册

第一章 入职与离职
1.1 入职流程
新员工入职需携带身份证、学历证书原件，到人力资源部办理入职手续。
入职当天领取工牌、办公用品，并参加新员工培训。

1.2 离职流程
员工离职需提前 30 天提交书面申请，经部门经理和人力资源部审批后办理交接。
离职当天归还工牌、办公设备，并完成工作交接。

第二章 考勤制度
2.1 工作时间
公司实行标准工时制，工作时间为周一至周五 9:00-18:00，午休 12:00-13:00。

2.2 打卡规定
员工需通过企业微信打卡，每日上下班各打卡一次。
迟到 30 分钟以内扣 50 元，超过 30 分钟按旷工半天处理。

第三章 假期制度
3.1 法定节假日
按照国家规定执行，包括元旦、春节、清明、劳动节、端午、中秋、国庆。

3.2 年假
- 入职满 1 年：5 天年假
- 入职满 3 年：10 天年假
- 入职满 10 年：15 天年假
年假需提前 3 天申请，部门经理审批。年假不可跨年累积。

3.3 病假
病假需提供医院证明，3 天以内部门经理审批，3 天以上需人力资源部审批。
```

**Step 2：上传文档**

在左侧边栏上传 `test-doc.txt`，点击"导入文档"。

**Step 3：提问测试**

```
你：公司的年假政策是什么？
AI：根据《test-doc.txt》，公司年假政策如下：
    - 入职满 1 年：5 天年假
    - 入职满 3 年：10 天年假
    - 入职满 10 年：15 天年假
    年假需提前 3 天申请，部门经理审批。年假不可跨年累积。

你：迟到了怎么处理？
AI：根据《test-doc.txt》考勤制度，迟到处理规定如下：
    迟到 30 分钟以内扣 50 元，超过 30 分钟按旷工半天处理。

你：怎么请假？
AI：根据现有资料，关于请假流程的信息有限。《test-doc.txt》中仅提到：
    年假需提前 3 天申请，部门经理审批。
    病假需提供医院证明，3 天以内部门经理审批，3 天以上需人力资源部审批。
    其他类型假期的申请流程未在文档中提及。
```

---

## 五、进阶优化

### 5.1 支持更多文档格式

```python
# document_loader.py 新增支持

# Markdown 文件
from langchain_community.document_loaders import UnstructuredMarkdownLoader

# Excel 文件
from langchain_community.document_loaders import UnstructuredExcelLoader

# 网页内容
from langchain_community.document_loaders import WebBaseLoader

# JSON 文件
from langchain_community.document_loaders import JSONLoader
```

### 5.2 使用本地模型（省钱）

```python
# 使用 Ollama 本地模型
from langchain_community.llms import Ollama
from langchain_community.embeddings import OllamaEmbeddings

# LLM
llm = Ollama(model="qwen2.5:7b")

# Embedding
embeddings = OllamaEmbeddings(model="nomic-embed-text")
```

```bash
# 安装 Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# 下载模型
ollama pull qwen2.5:7b
ollama pull nomic-embed-text
```

### 5.3 使用其他向量数据库

```python
# FAISS（本地文件存储，轻量）
from langchain_community.vectorstores import FAISS
vectorstore = FAISS.from_documents(chunks, embeddings)

# Milvus（分布式，适合生产环境）
from langchain_community.vectorstores import Milvus
vectorstore = Milvus.from_documents(chunks, embeddings, connection_args={"host": "localhost", "port": 19530})

# Weaviate
from langchain_community.vectorstores import Weaviate
vectorstore = Weaviate.from_documents(chunks, embeddings, weaviate_url="http://localhost:8080")
```

### 5.4 多轮对话支持

```python
from langchain.memory import ConversationBufferWindowMemory
from langchain.chains import ConversationalRetrievalChain

memory = ConversationBufferWindowMemory(
    k=5,  # 保留最近 5 轮对话
    memory_key="chat_history",
    return_messages=True,
)

qa_chain = ConversationalRetrievalChain.from_llm(
    llm=llm,
    retriever=vectorstore.as_retriever(),
    memory=memory,
)
```

### 5.5 混合检索（关键词 + 语义）

```python
from langchain.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever

# BM25 关键词检索
bm25_retriever = BM25Retriever.from_documents(chunks)
bm25_retriever.k = 4

# 向量语义检索
vector_retriever = vectorstore.as_retriever(search_kwargs={"k": 4})

# 混合检索（各占 50% 权重）
ensemble_retriever = EnsembleRetriever(
    retrievers=[bm25_retriever, vector_retriever],
    weights=[0.4, 0.6],
)
```

---

## 六、部署方案

### 6.1 Docker 部署

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8501

CMD ["streamlit", "run", "app.py", "--server.port=8501", "--server.address=0.0.0.0"]
```

```bash
docker build -t rag-kb .
docker run -p 8501:8501 -v ./documents:/app/documents -v ./chroma_db:/app/chroma_db rag-kb
```

### 6.2 docker-compose 部署

```yaml
version: '3.8'
services:
  rag-app:
    build: .
    ports:
      - "8501:8501"
    volumes:
      - ./documents:/app/documents
      - ./chroma_db:/app/chroma_db
    env_file:
      - .env
    restart: unless-stopped
```

---

## 七、常见问题

### Q1：回答不准确怎么办？

```
优化方向：
1. 调整 chunk_size（太大丢失细节，太小缺乏上下文）
2. 增加 RETRIEVAL_TOP_K（检索更多相关文档）
3. 优化提示词模板
4. 使用更强的模型（gpt-4o 而非 gpt-4o-mini）
```

### Q2：文档导入太慢？

```
优化方案：
1. 使用异步处理
2. 分批导入（每次 100 个 chunk）
3. 使用更快的 Embedding 模型
4. 考虑使用 GPU 加速向量化
```

### Q3：如何处理扫描版 PDF？

```python
# 需要 OCR 支持
pip install pytesseract

# 使用 Unstructured 的 OCR 模式
from unstructured.partition.pdf import partition_pdf
elements = partition_pdf(filename="scan.pdf", strategy="ocr_only")
```

---

## 总结

本文带你从零搭建了一个完整的 RAG 知识库问答系统。核心流程：

```
文档 → 加载 → 切分 → 向量化 → 存储
                              ↓
用户提问 → 向量检索 → 找到相关文档 → AI 生成回答
```

项目代码结构清晰，可以在此基础上扩展：
- 接入更多文档格式
- 使用本地模型降低成本
- 添加多轮对话能力
- 部署到生产环境

动手做是最好的学习方式。把这个项目跑起来，你就真正理解了 RAG 的原理和实现。
