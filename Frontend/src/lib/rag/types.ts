// Shared types for the Private GPT — book corpus RAG interface
// Adapted to the otus-practice-dz4-enterprise-private-gpt project:
// corpus = 3 technical books, LLM = YandexGPT, embeddings = BGE-M3, vector DB = Chroma.

export interface DocumentChunk {
  id: string // chunk_id from the project: source::recursive_1000_150::page_N::chunk_M
  documentName: string // PDF filename (metadata "source")
  book: string // short book title for display
  page: number // PDF page number, 1-indexed (metadata "page")
  chunkInPage: number // chunk number within the page (metadata "chunk_in_page")
  text: string
  rank: number // 1-based order returned by similarity search (always present)
  score?: number // similarity 0..1 — ONLY when the distance metric is confirmed
  // (e.g. cosine). When the Chroma space is unknown/l2, this is omitted and the
  // UI shows ordering without a percentage.
}

export interface IndexedDocument {
  id: string
  name: string // PDF filename
  book: string // short title
  pages: number
  chunks: number
  sizeKb: number
}

export interface RagMetrics {
  retrievalMs: number
  generationMs: number
  totalMs: number
  // Real token counts from the LLM provider's usage metadata.
  // null when not reported (we never fake token counts).
  tokensIn: number | null
  tokensOut: number | null
}

export type QuestionCategory = "in-base" | "out-of-base" | "conflict" | "general"

export interface RagChatRequest {
  query: string
  topK: number
  temperature: number
  conversationId: string
  history?: { role: "user" | "assistant"; content: string }[]
}

export interface RagChatChunk {
  type: "token" | "sources" | "metrics" | "done" | "error" | "category"
  content?: string
  sources?: DocumentChunk[]
  metrics?: RagMetrics
  category?: QuestionCategory
  message?: string
}

export interface ConversationMessage {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: number
  sources?: DocumentChunk[]
  metrics?: RagMetrics
  category?: QuestionCategory
  streaming?: boolean
}

export interface Conversation {
  id: string
  title: string
  messages: ConversationMessage[]
  createdAt: number
  updatedAt: number
}

export interface SystemStatus {
  connected: boolean
  llmModel: string
  embeddingModel: string
  vectorDb: string
  backend: "local-python" | "mock"
  documentsCount: number
  chunksCount: number
  pagesCount: number
}
