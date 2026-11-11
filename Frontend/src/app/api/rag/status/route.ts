import { SYSTEM_INFO, INDEXED_DOCUMENTS } from "@/lib/rag/mock-engine"
import type { SystemStatus } from "@/lib/rag/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const RAG_BACKEND_URL = process.env.RAG_BACKEND_URL || ""

export async function GET() {
  // ---- WORKING MODE: real status from the Python bridge / Chroma ----
  if (RAG_BACKEND_URL) {
    try {
      const r = await fetch(`${RAG_BACKEND_URL}/status`, {
        signal: AbortSignal.timeout(2000),
      })
      if (r.ok) {
        const data = (await r.json()) as SystemStatus
        // Trust the backend's own connected flag.
        return Response.json(data, { headers: { "Cache-Control": "no-store" } })
      }
      throw new Error(`status ${r.status}`)
    } catch {
      // Backend down: report disconnected with NO mock counts.
      const offline: SystemStatus = {
        connected: false,
        llmModel: "",
        embeddingModel: "",
        vectorDb: "",
        backend: "local-python",
        documentsCount: 0,
        chunksCount: 0,
        pagesCount: 0,
      }
      return Response.json(offline, { headers: { "Cache-Control": "no-store" } })
    }
  }

  // ---- DEMO MODE ----
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
  return Response.json(status, { headers: { "Cache-Control": "no-store" } })
}
