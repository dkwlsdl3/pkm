---
title: ChromaDB
tags:
  - tech
  - ai
created: 2026-05-14 (목)
---

# ChromaDB

> **TL;DR**: 로컬 실행 가능한 오픈소스 벡터 데이터베이스 — 별도 서버 없이 문서 임베딩 저장·유사도 검색을 담당.

---

## 개요

- **무엇**: RAG의 검색 계층을 담당하는 오픈소스 벡터 DB
- **왜 / 언제**: 별도 서버 없이 로컬에서 문서 임베딩을 저장하고 의미 유사도 검색이 필요할 때

## 동작 / 예시

```python
import chromadb

client = chromadb.Client()
collection = client.create_collection("my_docs")

# 문서 저장
collection.add(
    documents=["Lustre는 HPC 분산 파일시스템이다"],
    ids=["doc1"]
)

# 유사 문서 검색
results = collection.query(
    query_texts=["분산 스토리지 시스템"],
    n_results=3
)
```

---

## 관련

- [[rag]]
- [[vector-db]]
- [[ai-overview]]
