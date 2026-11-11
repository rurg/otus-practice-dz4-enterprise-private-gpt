import { NextRequest } from "next/server"
import { runRagTurn, streamAnswer, SYSTEM_INFO, INDEXED_DOCUMENTS } from "@/lib/rag/mock-engine"
import type { RagChatChunk, RagChatRequest, SystemStatus } from "@/lib/rag/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Real Python RAG backend (FastAPI bridge). When set, the UI is in WORKING mode:
// all requests go to Python and there is NO silent fallback to the mock engine.
// When empty → demo mode (built-in mock engine with book-corpus sample data).
const RAG_BACKEND_URL = process.env.RAG_BACKEND_URL || ""

export async function POST(req: NextRequest) {
  const body = (await req.json()) as RagChatRequest
  const { query, topK, temperature, conversationId } = body

  if (!query || !query.trim()) {
    return new Response(JSON.stringify({ error: "empty query" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const encoder = new TextEncoder()

  // ---- WORKING MODE: proxy to the real Python RAG bridge. No mock fallback. ----
  if (RAG_BACKEND_URL) {
    let upstream: Response
    try {
      upstream = await fetch(`${RAG_BACKEND_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120000),
      })
    } catch (err) {
      // Backend unreachable → surface a clear error to the user (do NOT mock).
      return errorStream(
        encoder,
        `Python RAG-бэкенд недоступен по адресу ${RAG_BACKEND_URL}. ` +
          `Запустите мост: uvicorn rag_server:app --port 8000. ` +
          `Ошибка: ${(err as Error).message}`,
      )
    }
    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text().catch(() => upstream.statusText)
      return errorStream(
        encoder,
        `RAG-бэкенд вернул ошибку ${upstream.status}: ${detail.slice(0, 300)}`,
      )
    }
    // Pass the SSE stream through unchanged.
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Rag-Backend": "local-python",
      },
    })
  }

  // ---- DEMO MODE: built-in mock engine ----
  const turn = runRagTurn({ query, topK, temperature, conversationId })

  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: RagChatChunk) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
      }

      send({ type: "category", category: turn.category })
      send({ type: "sources", sources: turn.sources })
      await sleep(turn.metrics.retrievalMs)
      for await (const tok of streamAnswer(turn.answer)) {
        send({ type: "token", content: tok })
      }
      send({ type: "metrics", metrics: turn.metrics })
      send({ type: "done" })
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Rag-Backend": "mock",
      "X-Rag-Model": SYSTEM_INFO.llmModel,
    },
  })
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, Math.min(ms, 400)))
}

// SSE response carrying a single error event (consumed by the frontend chat).
// Status 200 + event stream so the client's SSE parser handles it (a non-2xx
// status would make fetch() throw / read the raw body as text).
function errorStream(encoder: TextEncoder, message: string) {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "error", message })}\n\n`),
      )
      controller.close()
    },
  })
  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Rag-Backend": "local-python",
    },
  })
}

// Demo-mode status (only used when no RAG_BACKEND_URL is configured).
export async function GET() {
  const pagesCount = INDEXED_DOCUMENTS.reduce((a, d) => a + d.pages, 0)
  const chunksCount = INDEXED_DOCUMENTS.reduce((a, d) => a + d.chunks, 0)
  const status: SystemStatus = {
    connected: true,
    llmModel: SYSTEM_INFO.llmModel,
    embeddingModel: SYSTEM_INFO.embeddingModel,
    vectorDb: SYSTEM_INFO.vectorDb,
    backend: "mock",
    documentsCount: INDEXED_DOCUMENTS.length,
    chunksCount,
    pagesCount,
  }
  return Response.json(status)
}
