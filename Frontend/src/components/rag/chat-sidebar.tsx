"use client"

import * as React from "react"
import {
  Plus,
  MessageSquare,
  Trash2,
  BookOpen,
  Database,
  Cpu,
  Boxes,
  Search,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useChatStore } from "@/store/chat-store"
import type { IndexedDocument, SystemStatus } from "@/lib/rag/types"

interface Props {
  status: SystemStatus | null
  documents: IndexedDocument[]
}

const BOOK_COLORS: Record<string, string> = {
  "Генеративный ИИ на практике": "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  "Девлин — LLM-агенты": "bg-sky-500/15 text-sky-400 border-sky-500/20",
  "Дронов — LangChain": "bg-amber-500/15 text-amber-400 border-amber-500/20",
}

function bookColor(book: string): string {
  return BOOK_COLORS[book] || "border-border/40 bg-muted/20"
}

export function ChatSidebar({ status, documents }: Props) {
  const conversations = useChatStore((s) => s.conversations)
  const activeId = useChatStore((s) => s.activeId)
  const newConversation = useChatStore((s) => s.newConversation)
  const setActive = useChatStore((s) => s.setActive)
  const deleteConversation = useChatStore((s) => s.deleteConversation)

  const totalChunks = documents.reduce((a, d) => a + d.chunks, 0)
  const totalPages = documents.reduce((a, d) => a + d.pages, 0)

  return (
    <div className="flex h-full flex-colflex h-full w-full min-w-0 flex-col overflow-hidden">
      <div className="p-3">
        <Button
          onClick={newConversation}
          className="w-full justify-start gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Новый диалог
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-0.5 px-1 pb-4">
          <div className="px-2 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Диалоги
          </div>
          {conversations.length === 0 && (
            <div className="px-2 py-6 text-center text-xs text-muted-foreground">
              История пуста
            </div>
          )}
          {conversations.map((c) => (
            <div
              key={c.id}
              className={cn(
                "group flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors",
                c.id === activeId
                  ? "bg-primary/12 text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
              onClick={() => setActive(c.id)}
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60" />
              <span className="flex-1 truncate text-[13px]">{c.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteConversation(c.id)
                }}
                className="opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Удалить диалог"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Knowledge base status */}
      <div className="border-t border-border/60 p-3">
        <div className="mb-2 flex items-center gap-2 px-1">
          <Database className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Корпус книг
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 px-1 pb-3">
          <Stat icon={<BookOpen className="h-3 w-3" />} label="Книг" value={String(documents.length)} />
          <Stat icon={<FileText className="h-3 w-3" />} label="Страниц" value={String(status?.pagesCount ?? totalPages)} />
          <Stat icon={<Boxes className="h-3 w-3" />} label="Чанков" value={String(status?.chunksCount ?? totalChunks)} />
        </div>

        <ScrollArea className="max-h-44 px-1">
          <div className="space-y-1.5 pb-1">
            {documents.map((d) => (
              <div
                key={d.id}
                className="flex items-start gap-2 rounded-md border border-border/40 bg-muted/20 px-2 py-1.5"
              >
                <BookOpen className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[11px] leading-tight text-foreground/90" title={d.name}>
                    {d.book}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Badge variant="outline" className={cn("h-4 px-1 text-[9px] font-medium", bookColor(d.book))}>
                      {d.pages} стр.
                    </Badge>
                    <span className="text-[9px] text-muted-foreground">
                      {d.chunks} чанк. · {Math.round(d.sizeKb / 1024)} МБ
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {status && (
          <div className="mt-3 space-y-1.5 rounded-lg border border-border/40 bg-muted/20 p-2.5">
            <ModelRow icon={<Cpu className="h-3 w-3" />} label="LLM" value={status.llmModel} />
            <ModelRow icon={<Search className="h-3 w-3" />} label="Embeddings" value={status.embeddingModel} />
            <ModelRow icon={<Database className="h-3 w-3" />} label="Vector DB" value={status.vectorDb} />
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/40 bg-muted/20 px-1.5 py-1.5">
      <div className="flex items-center gap-1 text-muted-foreground">
        {icon}
        <span className="text-[9px] uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-0.5 text-center font-mono text-sm font-semibold text-foreground">{value}</div>
    </div>
  )
}

function ModelRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="truncate font-mono text-[10px] text-foreground/80" title={value}>
          {value}
        </div>
      </div>
    </div>
  )
}
