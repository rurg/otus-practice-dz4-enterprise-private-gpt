"use client"

import * as React from "react"
import { Send, Square, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { TestScenarios } from "./test-scenarios"
import { useChatStore } from "@/store/chat-store"
import { cn } from "@/lib/utils"

interface Props {
  onSend: (q: string) => void
  onStop: () => void
  streaming: boolean
}

export function ChatInput({ onSend, onStop, streaming }: Props) {
  const [value, setValue] = React.useState("")
  const topK = useChatStore((s) => s.topK)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const submit = () => {
    if (!value.trim() || streaming) return
    onSend(value)
    setValue("")
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  // auto-resize
  React.useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 200) + "px"
  }, [value])

  return (
    <div className="border-t border-border/60 bg-background/80 px-3 py-3 backdrop-blur-xl sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <TestScenarios onSelect={(q) => !streaming && onSend(q)} variant="inline" />
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Hash className="h-3 w-3" />
            Top-K: <span className="font-mono text-foreground">{topK}</span>
          </div>
        </div>

        <div
          className={cn(
            "relative flex items-end gap-2 rounded-2xl border bg-card/60 p-2 transition-colors",
            "focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30",
            "border-border/60",
          )}
        >
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Спросите про RAG, агентов, LangChain, чанкирование, эмбеддинги…"
            rows={1}
            className="min-h-[44px] flex-1 resize-none border-0 bg-transparent px-2 py-2.5 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={streaming}
          />
          {streaming ? (
            <Button
              size="icon"
              variant="secondary"
              onClick={onStop}
              className="h-10 w-10 shrink-0 rounded-xl"
              aria-label="Остановить"
            >
              <Square className="h-4 w-4 fill-current" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={submit}
              disabled={!value.trim()}
              className="h-10 w-10 shrink-0 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              aria-label="Отправить"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="mt-1.5 px-1 text-center text-[10px] text-muted-foreground/70">
          Enter — отправить · Shift+Enter — новая строка · ответы ограничены корпусом из 3 книг
        </div>
      </div>
    </div>
  )
}
