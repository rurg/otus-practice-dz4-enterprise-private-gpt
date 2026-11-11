"use client"

import * as React from "react"
import { Bot, BookMarked, BookOpen, Cpu, Database, Sparkles } from "lucide-react"
import { ChatMessage } from "./chat-message"
import { TestScenarios } from "./test-scenarios"
import { useChatStore, activeConversation } from "@/store/chat-store"

import type { DocumentChunk } from "@/lib/rag/types"

export function ChatMessages({ onShowSources, onSend }: { onShowSources?: (sources: DocumentChunk[]) => void; onSend?: (q: string) => void }) {
  const conv = useChatStore(activeConversation)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [conv?.messages])

  if (!conv || conv.messages.length === 0) {
    return <EmptyState onSend={onSend} />
  }

  return (
    <div ref={scrollRef} className="scrollbar-slim flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl divide-y divide-border/30">
        {conv.messages.map((m) => (
          <ChatMessage key={m.id} message={m} onShowSources={onShowSources} />
        ))}
      </div>
    </div>
  )
}

function EmptyState({ onSend }: { onSend?: (q: string) => void }) {
  return (
    <div className="scrollbar-slim flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-10 text-center sm:py-16">
        <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/12 ring-1 ring-primary/25">
          <Bot className="h-8 w-8 text-primary" />
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-background ring-1 ring-border">
            <BookMarked className="h-3 w-3 text-primary" />
          </span>
        </div>

        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Помощник по корпусу технических книг
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Задайте вопрос по книгам о генеративном ИИ, RAG и LangChain. Ответ формируется{" "}
          <span className="text-foreground/90">только</span> на основе найденных фрагментов с указанием
          книги и страницы.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Feature icon={<BookOpen className="h-3 w-3" />} text="Корпус технических книг" />
          <Feature icon={<Cpu className="h-3 w-3" />} text="BGE-M3 + Chroma" />
          <Feature icon={<Database className="h-3 w-3" />} text="цитирование [1][2]" />
        </div>

        <div className="mt-8 w-full">
          <div className="mb-3 flex items-center gap-2 text-left">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Тестовые сценарии
            </span>
          </div>
          <TestScenarios variant="card" onSelect={(q) => onSend?.(q)} />
        </div>
      </div>
    </div>
  )
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/30 px-2.5 py-1 text-[11px] text-muted-foreground">
      <span className="text-primary">{icon}</span>
      {text}
    </span>
  )
}
