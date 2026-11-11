"use client"

import * as React from "react"
import {
  FileStack,
  BookOpen,
  ChevronDown,
  Percent,
  Inbox,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { DocumentChunk } from "@/lib/rag/types"

const BOOK_COLORS: Record<string, string> = {
  "Генеративный ИИ на практике": "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  "Девлин — LLM-агенты": "bg-sky-500/15 text-sky-400 border-sky-500/20",
  "Дронов — LangChain": "bg-amber-500/15 text-amber-400 border-amber-500/20",
}

function bookColor(book: string): string {
  return BOOK_COLORS[book] || "border-border/40 bg-muted/20"
}

export function SourcesPanel({ sources }: { sources: DocumentChunk[] }) {
  if (sources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/40">
          <Inbox className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="text-sm font-medium">Нет источников</div>
        <div className="max-w-[220px] text-[11px] text-muted-foreground">
          Задайте вопрос по корпусу — здесь появятся найденные фрагменты книг со страницей и оценкой релевантности.
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full overflow-x-hidden overflow-y-auto">
      <div className="space-y-2 p-3">
        <div className="flex items-center gap-2 px-1 pb-1">
          <FileStack className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Найдено фрагментов
          </span>
          <Badge variant="outline" className="ml-auto h-5 px-1.5 text-[10px]">
            {sources.length}
          </Badge>
        </div>

        {sources.map((src, i) => (
          <SourceCard key={src.id} source={src} index={i} />
        ))}

        <div className="px-1 pt-2 text-[10px] text-muted-foreground/70">
          {sources.some((s) => typeof s.score === "number")
            ? "Фрагменты отсортированы по косинусной близости эмбеддингов BGE-M3; процент — подтверждённая метрика Chroma."
            : "Фрагменты отсортированы по схожести (Chroma). Процент скрыт: метрика расстояния не подтверждена как cosine."}
        </div>
      </div>
    </div>
  )
}

function SourceCard({ source, index }: { source: DocumentChunk; index: number }) {
  const [open, setOpen] = React.useState(index === 0)
  const hasScore = typeof source.score === "number"
  const pct = hasScore ? Math.round((source.score as number) * 100) : 0
  const colorCls = bookColor(source.book)

  return (
    <div className="overflow-hidden rounded-lg border border-border/50 bg-card/40">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-2 px-2.5 py-2 text-left transition-colors hover:bg-muted/30"
      >
        <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className={cn("h-4 px-1 text-[9px]", colorCls)}>
              {source.book.split(" — ")[0]}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              стр. {source.page} · чанк {source.chunkInPage}
            </span>
            <Badge variant="secondary" className="ml-auto h-4 px-1 font-mono text-[9px] tabular-nums">
              #{source.rank}
            </Badge>
          </div>
          <div className="mt-0.5 break-all text-[11px] leading-tight text-foreground/85" title={source.documentName}>
            {source.documentName}
          </div>
          {hasScore ? (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full",
                    pct >= 70 ? "bg-emerald-400" : pct >= 40 ? "bg-amber-400" : "bg-rose-400",
                  )}
                  style={{ width: `${Math.max(pct, 4)}%` }}
                />
              </div>
              <span className="flex items-center gap-0.5 font-mono text-[10px] font-medium tabular-nums">
                <Percent className="h-2.5 w-2.5 text-muted-foreground" />
                {pct}
              </span>
            </div>
          ) : (
            <div className="mt-1.5 text-[10px] text-muted-foreground/70">
              порядок по схожести · процент скрыт (метрика Chroma не подтверждена)
            </div>
          )}
        </div>
        <ChevronDown
          className={cn(
            "mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="border-t border-border/40 px-2.5 py-2">
          <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-[11px] leading-relaxed text-muted-foreground">
            {source.text}
          </p>
        </div>
      )}
    </div>
  )
}
