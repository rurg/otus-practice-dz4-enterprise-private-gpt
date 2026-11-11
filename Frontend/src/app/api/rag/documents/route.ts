import { INDEXED_DOCUMENTS } from "@/lib/rag/mock-engine"
import type { IndexedDocument } from "@/lib/rag/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const RAG_BACKEND_URL = process.env.RAG_BACKEND_URL || ""

export async function GET() {
  // ---- WORKING MODE: real book list from the Python bridge (aggregated from Chroma) ----
  if (RAG_BACKEND_URL) {
    try {
      const r = await fetch(`${RAG_BACKEND_URL}/documents`, {
        signal: AbortSignal.timeout(4000),
      })
      if (r.ok) {
        const data = (await r.json()) as { documents: IndexedDocument[] }
        return Response.json(data, { headers: { "Cache-Control": "no-store" } })
      }
      throw new Error(`documents ${r.status}`)
    } catch {
      // Backend down: empty list (no mock books in working mode).
      return Response.json(
        { documents: [] as IndexedDocument[] },
        { headers: { "Cache-Control": "no-store" } },
      )
    }
  }

  // ---- DEMO MODE ----
  return Response.json(
    { documents: INDEXED_DOCUMENTS },
    { headers: { "Cache-Control": "no-store" } },
  )
}
