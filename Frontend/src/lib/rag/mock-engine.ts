import type {
  DocumentChunk,
  IndexedDocument,
  QuestionCategory,
  RagChatRequest,
  RagMetrics,
} from "./types"

// ============================================================================
// Private GPT — Mock RAG engine (book corpus edition)
// ----------------------------------------------------------------------------
// Mirrors the otus-practice-dz4-enterprise-private-gpt pipeline:
//   corpus  = 3 technical books (GenAI / LLM-agents / LangChain)
//   embed   = BAAI/bge-m3 (HuggingFaceEmbeddings, normalized)
//   store   = Chroma, collection "books_bge_m3", data/chroma
//   llm     = YandexGPT Pro 5.1 (Yandex AI Studio, OpenAI-compatible)
//   split   = RecursiveCharacterTextSplitter chunk_size=1000 overlap=150
//
// To connect the REAL Python pipeline instead, set RAG_BACKEND_URL and the
// Next.js API route proxies to python-bridge/rag_server.py (which imports the
// project's real src.* modules).
// ============================================================================

interface KbChunk {
  id: string
  documentName: string
  book: string
  page: number
  chunkInPage: number
  text: string
  keywords: string[]
}

// ---- Corpus: 3 technical books, realistic chunks w/ page metadata ----------
const KNOWLEDGE_BASE: KbChunk[] = [
  {
    id: "devlin-agents-1",
    documentName: "Девлин_LLM_агенты_RAG.pdf",
    book: "Девлин — LLM-агенты",
    page: 142,
    chunkInPage: 1,
    text:
      "Адаптивный агент отличается от статичной LLM тем, что способен самостоятельно выбирать инструменты и планировать шаги под конкретную задачу. " +
      "Статичная LLM лишь генерирует текст по фиксированному шаблону промпта. " +
      "Агент использует память, набор инструментов и цикл рассуждений «осмысление → действие → наблюдение», чтобы адаптироваться к контексту и уточнять ход решения. " +
      "Граф знаний и RAG дают агенту доступ к внешним фактам, которых нет в его весах.",
    keywords: [
      "агент", "агента", "агенты", "адаптивный", "адаптивного", "статичн", "llm",
      "инструмент", "планиров", "память", "осмысление", "действие", "наблюдение",
      "цикл", "рассужден", "граф", "знаний", "devlin", "девлин",
    ],
  },
  {
    id: "devlin-rag-1",
    documentName: "Девлин_LLM_агенты_RAG.pdf",
    book: "Девлин — LLM-агенты",
    page: 87,
    chunkInPage: 1,
    text:
      "RAG в составе агента работает как долгосрочная память: по запросу агента из векторной базы извлекаются релевантные фрагменты, которые подставляются в контекст промпта. " +
      "Это позволяет обновлять знания агента без переобучения — достаточно переиндексировать новые документы. " +
      "В отличие от fine-tuning, RAG сохраняет источник факта, что важно для проверяемости ответа.",
    keywords: [
      "rag", "память", "векторн", "база", "извлекаются", "фрагмент", "контекст",
      "промпт", "переобучен", "переиндекс", "fine-tuning", "fine", "tuning",
      "проверяем", "источник", "агент",
    ],
  },
  {
    id: "dronov-chunking-1",
    documentName: "Дронов_LangChain.pdf",
    book: "Дронов — LangChain",
    page: 214,
    chunkInPage: 1,
    text:
      "Для разбиения документов в LangChain применяется RecursiveCharacterTextSplitter. " +
      "Размер чанка 1000 символов с перекрытием 150 символов — рабочая отправная конфигурация для технических книг. " +
      "Сплиттер перебирает разделители по порядку: сначала границы абзацев (\\n\\n), затем строк (\\n), предложений (. ) и только в крайнем случае режет по словам или символам. " +
      "Это сохраняет смысловую целостность фрагментов и наследует метаданные страницы.",
    keywords: [
      "чанк", "чанки", "чанков", "chunk", "размер", "перекрыт", "overlap", "1000", "150",
      "разбиен", "splitter", "recursive", "langchain", "разделител", "абзац",
      "символ", "документ", "дорон", "dronov",
    ],
  },
  {
    id: "dronov-chain-1",
    documentName: "Дронов_LangChain.pdf",
    book: "Дронов — LangChain",
    page: 56,
    chunkInPage: 2,
    text:
      "Цепочка (Chain) в LangChain объединяет компоненты: промпт, модель, парсеры вывода и инструменты. " +
      "Начиная с версии 0.1 рекомендуется использовать LCEL (LangChain Expression Language) — декларативный синтаксис pipe: prompt | model | output_parser. " +
      "Это даёт потоковую передачу токенов, асинхронность и трассировку из коробки.",
    keywords: [
      "цепочка", "chain", "langchain", "lcel", "expression", "prompt", "модель",
      "парсер", "output_parser", "pipe", "токен", "потоков", "stream", "асинхрон",
      "трассировк", "компонент",
    ],
  },
  {
    id: "genai-rag-1",
    documentName: "Генеративный_ИИ_на_практике.pdf",
    book: "Генеративный ИИ на практике",
    page: 318,
    chunkInPage: 1,
    text:
      "RAG (Retrieval-Augmented Generation) дополняет ответ языковой модели релевантными фрагментами из внешней базы знаний. " +
      "Это снижает галлюцинации и позволяет опираться на актуальные и проверяемые источники. " +
      "В отличие от fine-tuning, RAG не требует переобучения модели при обновлении базы знаний — достаточно переиндексировать документы.",
    keywords: [
      "rag", "retrieval", "augmented", "generation", "галлюцинац", "источник",
      "fine-tuning", "fine", "tuning", "переобучен", "база", "знаний", "фрагмент",
      "генеративн", "языков", "модел",
    ],
  },
  {
    id: "genai-embed-1",
    documentName: "Генеративный_ИИ_на_практике.pdf",
    book: "Генеративный ИИ на практике",
    page: 205,
    chunkInPage: 1,
    text:
      "Эмбеддинги превращают текст в векторы так, что близкие по смыслу фрагменты оказываются рядом в векторном пространстве. " +
      "Мультиязычные модели вроде BGE-M3 дают качественные векторы для русского и английского текста. " +
      "Нормализация векторов позволяет использовать косинусную близость через скалярное произведение, что ускоряет поиск.",
    keywords: [
      "эмбеддинг", "вектор", "bge", "bge-m3", "мультиязыч", "косинусн", "близост",
      "скалярн", "произведен", "нормализац", "поиск", "смысл", "пространств",
    ],
  },
]

// ---- Indexed catalogue (shown in the knowledge base panel) -----------------
export const INDEXED_DOCUMENTS: IndexedDocument[] = [
  {
    id: "doc-genai",
    name: "Генеративный_ИИ_на_практике.pdf",
    book: "Генеративный ИИ на практике",
    pages: 330,
    chunks: 1070,
    sizeKb: 4820,
  },
  {
    id: "doc-devlin",
    name: "Девлин_LLM_агенты_RAG.pdf",
    book: "Девлин — LLM-агенты",
    pages: 312,
    chunks: 599,
    sizeKb: 3940,
  },
  {
    id: "doc-dronov",
    name: "Дронов_LangChain.pdf",
    book: "Дронов — LangChain",
    pages: 345,
    chunks: 1181,
    sizeKb: 5210,
  },
]

// ---- Tokenization & retrieval ----------------------------------------------
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1)
}

function scoreChunk(queryTokens: string[], chunk: KbChunk): number {
  if (queryTokens.length === 0) return 0
  let hits = 0
  for (const q of queryTokens) {
    for (const kw of chunk.keywords) {
      if (kw === q || kw.startsWith(q) || q.startsWith(kw)) {
        hits += 1
        break
      }
    }
  }
  const ratio = hits / Math.max(queryTokens.length, 1)
  return Math.min(1, ratio * 0.95 + hits * 0.05)
}

export function retrieve(query: string, topK: number): { chunk: KbChunk; score: number }[] {
  const tokens = tokenize(query)
  const scored = KNOWLEDGE_BASE.map((chunk) => ({ chunk, score: scoreChunk(tokens, chunk) }))
  return scored
    .filter((s) => s.score > 0.12)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}

export function toDocumentChunk(item: { chunk: KbChunk; score: number }, rank: number): DocumentChunk {
  return {
    id: item.chunk.id,
    documentName: item.chunk.documentName,
    book: item.chunk.book,
    page: item.chunk.page,
    chunkInPage: item.chunk.chunkInPage,
    text: item.chunk.text,
    rank,
    score: Math.round(item.score * 1000) / 1000,
  }
}

// ---- Classification (drives the 3 homework test scenarios) -----------------
const OUT_OF_BASE_MARKERS = [
  "пирог", "рецепт", "погода", "фильм", "столица", "франции", "готовить", "кулинар",
  "космос", "футбол", "музык", "стих", "анекдот", "шутк", "гороскоп", "кот",
]
const CONFLICT_MARKERS = [
  "размер чанка", "размер чанков", "chunk_size", "какой чанк", "какие чанки",
  "перекрытие", "overlap", "оптимальн", "лучше использовать", "размер фрагмент",
]

export function classifyQuestion(query: string): QuestionCategory {
  const q = query.toLowerCase()
  if (OUT_OF_BASE_MARKERS.some((m) => q.includes(m))) return "out-of-base"
  if (CONFLICT_MARKERS.some((m) => q.includes(m)) && (q.includes("чанк") || q.includes("chunk") || q.includes("фрагмент"))) {
    return "conflict"
  }
  const results = retrieve(query, 3)
  if (results.length > 0 && results[0].score > 0.25) return "in-base"
  return "general"
}

// ---- Answer generation (mirrors the real system prompt + [1][2] citations) -
function cite(sources: { chunk: KbChunk; score: number }[]): string {
  // The model is told to cite used fragments as [1], [2]…
  return sources
    .map((s, i) => `[${i + 1}] ${s.chunk.book}, PDF-страница ${s.chunk.page}`)
    .join("\n")
}

function buildAnswer(query: string, sources: { chunk: KbChunk; score: number }[], category: QuestionCategory): string {
  if (category === "out-of-base" || sources.length === 0) {
    return (
      "В найденных фрагментах нет ответа на этот вопрос [1]. " +
      "Корпус состоит из технических книг по генеративному ИИ, RAG и LangChain — " +
      "переформулируйте вопрос, если он относится к этим темам.\n\n" +
      "---\n*Ответ ограничен загруженным корпусом книг. Источники — справа с оценкой релевантности.*"
    )
  }

  const q = query.toLowerCase()
  let prefix = ""
  let body = ""
  const usedCite = cite(sources)

  if (q.includes("адаптивн") || (q.includes("агент") && q.includes("статич"))) {
    prefix = "Согласно корпусу [1][2]:"
    body =
      "Адаптивный агент отличается от статичной LLM тем, что **сам выбирает инструменты и планирует шаги** под задачу, " +
      "тогда как статичная LLM лишь генерирует текст по фиксированному шаблону промпта [1]. " +
      "Агент использует память, инструменты и цикл рассуждений «осмысление → действие → наблюдение», " +
      "а граф знаний и RAG дают ему доступ к внешним фактам, которых нет в весах модели [1]. " +
      "В отличие от fine-tuning, RAG сохраняет источник факта и обновляется переиндексацией без переобучения [2]."
  } else if (q.includes("размер чанк") || q.includes("chunk_size") || q.includes("перекрыт") || q.includes("overlap") || (q.includes("чанк") && (q.includes("оптимальн") || q.includes("размер") || q.includes("лучше")))) {
    prefix = "Согласно книге по LangChain [1]:"
    body =
      "Для разбиения документов применяется `RecursiveCharacterTextSplitter`; рабочая отправная конфигурация для технических книг — **chunk_size = 1000 символов, overlap = 150 символов** [1]. " +
      "Это внутренняя рекомендация корпуса, и она имеет приоритет над общими советами «512/256»: " +
      "сплиттер перебирает разделители (абзацы → строки → предложения → слова → символы), сохраняя смысловую целостность и метаданные страницы [1]."
  } else if (q.includes("rag") && (q.includes("отлич") || q.includes("fine") || q.includes("переобуч"))) {
    prefix = "По корпусу [1][2]:"
    body =
      "RAG (Retrieval-Augmented Generation) дополняет ответ модели релевантными фрагментами из внешней базы знаний, " +
      "что снижает галлюцинации и даёт проверяемые источники [1]. " +
      "В отличие от fine-tuning, RAG **не требует переобучения** при обновлении базы — достаточно переиндексировать документы, " +
      "и при этом сохраняется источник факта [1][2]."
  } else if (q.includes("эмбеддинг") || q.includes("bge") || q.includes("вектор") && q.includes("близост")) {
    prefix = "По книге «Генеративный ИИ на практике» [1]:"
    body =
      "Эмбеддинги превращают текст в векторы так, что близкие по смыслу фрагменты оказываются рядом в пространстве [1]. " +
      "Мультиязычная модель **BGE-M3** даёт качественные векторы для русского и английского текста; " +
      "нормализация позволяет считать косинусную близость через скалярное произведение, ускоряя поиск [1]."
  } else if (q.includes("langchain") && (q.includes("chain") || q.includes("цепочк") || q.includes("lcel"))) {
    prefix = "По книге Дронова [1]:"
    body =
      "Цепочка (Chain) в LangChain объединяет промпт, модель, парсеры вывода и инструменты [1]. " +
      "С версии 0.1 рекомендуется **LCEL** (LangChain Expression Language) — декларативный pipe " +
      "`prompt | model | output_parser`, дающий потоковую передачу токенов, асинхронность и трассировку из коробки [1]."
  } else {
    prefix = "По найденным фрагментам корпуса:"
    body = sources.map((s, i) => `[${i + 1}] ${s.chunk.text}`).join("\n\n")
  }

  return `${prefix}\n\n${body}\n\n---\nИспользованные источники:\n${usedCite}\n\n*Ответ ограничен загруженным корпусом книг. Источники — справа с оценкой релевантности.*`
}

// ---- Public API: one full RAG turn -----------------------------------------
export interface RagTurnResult {
  answer: string
  sources: DocumentChunk[]
  metrics: RagMetrics
  category: QuestionCategory
}

export function runRagTurn(req: RagChatRequest): RagTurnResult {
  const t0 = performance.now()
  const category = classifyQuestion(req.query)
  const retrieved = retrieve(req.query, req.topK)
  const t1 = performance.now()
  const sources = retrieved.map((item, i) => toDocumentChunk(item, i + 1))
  const answer = buildAnswer(req.query, retrieved, category)
  const t2 = performance.now()

  // Realistic latencies: BGE-M3 query embed + Chroma search ~ tens-hundreds ms;
  // YandexGPT generation ~ 1-3s depending on topK (more context tokens).
  const retrievalMs = Math.round((t1 - t0) + 140 + Math.random() * 120)
  const generationMs = Math.round((t2 - t1) + 900 + Math.random() * 1400 + req.topK * 180)

  return {
    answer,
    sources,
    category,
    metrics: {
      retrievalMs,
      generationMs,
      totalMs: retrievalMs + generationMs,
      // Demo engine has no real LLM — we do not fake token counts.
      tokensIn: null,
      tokensOut: null,
    },
  }
}

// Stream a string word-by-word for a realistic typing effect.
export async function* streamAnswer(answer: string): AsyncGenerator<string> {
  const tokens = answer.match(/\S+\s*/g) ?? [answer]
  for (const tok of tokens) {
    yield tok
    await new Promise((r) => setTimeout(r, 16 + Math.random() * 52))
  }
}

export const SYSTEM_INFO = {
  llmModel: "yandexgpt-5.1",
  embeddingModel: "BAAI/bge-m3 (normalized)",
  vectorDb: "Chroma · books_bge_m3",
}
