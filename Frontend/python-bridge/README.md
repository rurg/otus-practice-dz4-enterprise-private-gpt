# Private GPT — FastAPI Bridge (otus DZ4 edition)

Тонкий HTTP-мост, который оборачивает **реальный RAG-пайплайн проекта**
`otus-practice-dz4-enterprise-private-gpt` (модули `src.*`) в API для Next.js-фронтенда.

Фронтенд работает в двух режимах:

| Режим | Когда | Как включить |
|-------|-------|--------------|
| **Demo engine** | по умолчанию | ничего настраивать не надо — UI работает на встроенном mock-движке с реалистичными чанками из 3 книг |
| **Real Python RAG** | подключён ваш otus-проект | задать `RAG_BACKEND_URL` в `.env.local` Next.js проекта |

## Что использует мост из otus-проекта

- `src.llm.get_llm()` — YandexGPT Pro 5.1 (OpenAI-compatible endpoint Yandex AI Studio)
- `src.storage.chroma_store.get_store(embeddings)` — Chroma, коллекция `books_bge_m3`
- `langchain_huggingface.HuggingFaceEmbeddings` с `BAAI/bge-m3`, `normalize_embeddings=True`
- `store.similarity_search_with_score(question, k=top_k)` — поиск с оценкой (дистанция → релевантность 0..1)
- `llm.stream([SystemMessage, HumanMessage])` — потоковая генерация токенов (с фолбэком на `.invoke()`)
- Системный промпт и формат контекста `[1][2] + книга/страница` — те же, что в `src/rag.py`

## Установка

1. Скопируйте `rag_server.py` в **корень** otus-проекта (рядом с `pyproject.toml` и папкой `src/`), чтобы работали импорты `from src.llm import get_llm`.

2. Добавьте FastAPI в зависимости (виртуальное окружение `uv`):
   ```bash
   cd otus-practice-dz4-enterprise-private-gpt
   uv pip install fastapi uvicorn
   ```

3. Убедитесь, что корпус уже проиндексирован в Chroma:
   ```bash
   uv run python -m src.index_documents
   ```

4. Запустите мост:
   ```bash
   uv run uvicorn rag_server:app --port 8000 --reload
   # или:  uv run python rag_server.py
   ```

5. Проверьте здоровье:
   ```bash
   curl http://localhost:8000/health
   # {"status":"ok","backend":"local-python","model":"yandexgpt-5.1"}
   ```

## Подключение к Next.js-фронтенду

В Next.js проекте создайте `.env.local`:
```bash
RAG_BACKEND_URL=http://localhost:8000
```
и перезапустите `bun run dev`. После этого шапка UI покажет статус
«RAG-пайплайн подключён», а все ответы пойдут от вашего реального RAG:
BGE-M3 + Chroma + YandexGPT — с реальными книгами, страницами и метриками latency.

Пока `RAG_BACKEND_URL` не задан или бэкенд недоступен — фронт автоматически
падает в demo-режим, поэтому интерфейс всегда работоспособен (удобно для
презентации ДЗ без поднятого Python-окружения).

## Формат SSE-событий

UI ожидает такой поток (JSON в поле `data:`):
```
data: {"type":"category","category":"in-base"}
data: {"type":"sources","sources":[{...,"book":"Девлин — LLM-агенты","page":142,"chunkInPage":1,"score":0.81}]}
data: {"type":"token","content":"Согласно"}
data: {"type":"token","content":" корпусу"}
...
data: {"type":"metrics","metrics":{"retrievalMs":182,"generationMs":2140,"totalMs":2322,"tokensIn":612,"tokensOut":96}}
data: {"type":"done}
```

Источник каждого чанка несёт: `documentName` (PDF), `book` (короткое название),
`page` (PDF-страница), `chunkInPage`, `text`, `score` (0..1, из косинусной близости BGE-M3).
