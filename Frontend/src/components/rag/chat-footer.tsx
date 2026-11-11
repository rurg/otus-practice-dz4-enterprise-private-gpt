"use client"

import { BookMarked, Server, Cpu, Database } from "lucide-react"
import { StatusIndicator } from "./status-indicator"
import type { SystemStatus } from "@/lib/rag/types"

export function ChatFooter({
  status,
  statusLoading,
}: {
  status: SystemStatus | null
  statusLoading?: boolean
}) {
  return (
    <footer className="mt-auto shrink-0 border-t border-border/60 bg-background/80 px-3 py-2 backdrop-blur-xl sm:px-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-1">
            <Database className="h-3 w-3 text-emerald-400" /> Эмбеддинги и БД локальны
          </span>
          <span className="hidden items-center gap-1 sm:flex">
            <Server className="h-3 w-3" /> {status?.backend === "local-python" ? "Python bridge" : "Demo engine"}
          </span>
          <span className="hidden items-center gap-1 md:flex">
            <Cpu className="h-3 w-3" /> LLM: {status?.llmModel ?? "—"}
          </span>
          <span className="hidden items-center gap-1 md:flex">
            <BookMarked className="h-3 w-3 text-primary" /> {status?.vectorDb ?? "Chroma"}
          </span>
        </div>
        <StatusIndicator status={status} loading={statusLoading} compact className="lg:hidden" />
        <span className="font-mono">2PeachGPT · OTUS DZ4</span>
      </div>
    </footer>
  )
}
