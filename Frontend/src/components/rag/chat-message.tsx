"use client"

import * as React from "react"
import {
  User,
  Bot,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  Clock,
  Cpu,
  FileStack,
  Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { MarkdownRenderer } from "./markdown-renderer"
import { cn } from "@/lib/utils"
import type { ConversationMessage, QuestionCategory, DocumentChunk } from "@/lib/rag/types"

interface Props {
  message: ConversationMessage
  onShowSources?: (sources: DocumentChunk[]) => void
}

const CATEGORY_META: Record<
  QuestionCategory,
  { label: string; icon: React.ReactNode; cls: string }
> = {
  "in-base": {
    label: "В корпусе",
    icon: <ShieldCheck className="h-3 w-3" />,
    cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  },
  "out-of-base": {
    label: "Вне корпуса",
    icon: <ShieldAlert className="h-3 w-3" />,
    cls: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  },
  conflict: {
    label: "Конфликт фактов",
    icon: <AlertTriangle className="h-3 w-3" />,
    cls: "border-rose-500/30 bg-rose-500/10 text-rose-400",
  },
  general: {
    label: "Общий",
    icon: <Sparkles className="h-3 w-3" />,
    cls: "border-border/40 bg-muted/30 text-muted-foreground",
  },
}

export function ChatMessage({ message, onShowSources }: Props) {
  const isUser = message.role === "user"
  const cat = message.category ? CATEGORY_META[message.category] : null

  return (
    <div className={cn("msg-in flex gap-3 px-4 py-4 sm:px-6", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1",
          isUser
            ? "bg-primary/15 text-primary ring-primary/25"
            : "bg-emerald-500/12 text-emerald-400 ring-emerald-500/25",
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div className={cn("flex min-w-0 max-w-[85%] flex-col gap-1.5", isUser && "items-end")}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">
            {isUser ? "Вы" : "Помощник по книгам"}
          </span>
          {cat && !isUser && (
            <Badge variant="outline" className={cn("gap-1 px-1.5 py-0 text-[10px]", cat.cls)}>
              {cat.icon}
              {cat.label}
            </Badge>
          )}
        </div>

        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm",
            isUser
              ? "rounded-tr-sm bg-primary text-primary-foreground"
              : "rounded-tl-sm border border-border/50 bg-card/60",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          ) : (
            <div className={cn(message.streaming && "stream-caret")}>
              <MarkdownRenderer content={message.content || ""} />
            </div>
          )}
        </div>

        {/* Assistant footer: sources + metrics */}
        {!isUser && !message.streaming && message.content && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[11px] text-muted-foreground">
            {message.sources && message.sources.length > 0 && (
              <button
                onClick={() => onShowSources?.(message.sources!)}
                className="flex items-center gap-1 transition-colors hover:text-foreground"
              >
                <FileStack className="h-3 w-3" />
                Источников: <span className="font-mono text-foreground">{message.sources.length}</span>
              </button>
            )}
            {message.metrics && (
              <>
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Поиск: <span className="font-mono text-foreground">{message.metrics.retrievalMs} мс</span>
                </span>
                <span className="flex items-center gap-1">
                  <Cpu className="h-3 w-3" />
                  Генерация: <span className="font-mono text-foreground">{message.metrics.generationMs} мс</span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Всего: <span className="font-mono text-foreground">{message.metrics.totalMs} мс</span>
                </span>
                {message.metrics.tokensOut != null && (
                  <span className="hidden items-center gap-1 sm:flex">
                    токенов: <span className="font-mono text-foreground">{message.metrics.tokensIn}→{message.metrics.tokensOut}</span>
                  </span>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
