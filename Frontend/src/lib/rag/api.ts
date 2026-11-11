import type {
  RagChatRequest,
  RagChatChunk,
  SystemStatus,
  IndexedDocument,
} from "./types"

// Client-side helpers to talk to the Next.js RAG API routes.

export async function fetchStatus(): Promise<SystemStatus> {
  const res = await fetch("/api/rag/status", { cache: "no-store" })
  if (!res.ok) throw new Error("status failed")
  return res.json()
}

export async function fetchDocuments(): Promise<IndexedDocument[]> {
  const res = await fetch("/api/rag/documents", { cache: "no-store" })
  if (!res.ok) throw new Error("documents failed")
  const data = await res.json()
  return data.documents
}

// Stream a RAG chat turn via SSE. Calls onChunk for each parsed event.
export async function streamChat(
  req: RagChatRequest,
  onChunk: (chunk: RagChatChunk) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch("/api/rag/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal,
  })

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "request failed")
    onChunk({ type: "error", message: text })
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // SSE events are separated by a blank line
    let idx: number
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 2)
      const chunk = parseSse(raw)
      if (chunk) onChunk(chunk)
    }
  }
}

function parseSse(raw: string): RagChatChunk | null {
  const lines = raw.split("\n")
  let data = ""
  for (const line of lines) {
    if (line.startsWith("data:")) data += line.slice(5)
  }
  if (!data) return null
  try {
    return JSON.parse(data) as RagChatChunk
  } catch {
    return null
  }
}
