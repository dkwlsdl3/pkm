---
tags:
  - tech
created: 2026-05-14 (목)
---

# RAG / ChromaDB

> **TL;DR**: LLM이 모르는 내 데이터를 검색해서 답변에 활용하는 기법 — ChromaDB는 그 검색을 담당하는 벡터 DB

---

## RAG란

RAG(Retrieval-Augmented Generation) — 검색 기반 생성.

LLM은 학습 데이터 이후의 정보나 내부 문서를 모름. RAG는 질문과 관련된 문서를 먼저 검색해서 LLM 컨텍스트에 넣어주는 방식.

```
사용자 질문
  ↓
벡터 DB에서 관련 문서 검색 (유사도 검색)
  ↓
[검색된 문서 + 질문] → LLM
  ↓
답변 생성
```

---

## 벡터 DB가 필요한 이유

텍스트를 숫자 벡터(임베딩)로 변환하면 의미적 유사도 계산 가능.

```
"강아지" → [0.12, 0.87, ...]
"개"     → [0.11, 0.85, ...]  ← 유사!
"사과"   → [0.93, 0.02, ...]  ← 다름
```

키워드 검색(LIKE)은 단어가 정확히 일치해야 함. 벡터 검색은 의미가 비슷하면 찾음.

---

## ChromaDB

오픈소스 벡터 데이터베이스. 로컬 실행 가능, 별도 서버 불필요.

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

## 키워드 폴백

벡터 검색 결과가 없거나 신뢰도 낮을 때 일반 키워드 검색으로 fallback하는 패턴. 안정성 확보.

---

## 관련

- [[ai-overview]]
- [[local-llm-uncensored]]
