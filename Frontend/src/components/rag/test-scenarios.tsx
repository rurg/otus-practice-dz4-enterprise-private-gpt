"use client"

import * as React from "react"
import { ShieldCheck, ShieldAlert, AlertTriangle, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Scenario {
  id: string
  category: "in-base" | "out-of-base" | "conflict"
  title: string
  question: string
  description: string
}

const SCENARIOS: Scenario[] = [
  {
    id: "s1",
    category: "in-base",
    title: "Строго по корпусу",
    question: "Чем адаптивный агент отличается от статичной LLM?",
    description: "Ответ есть в книге Девлина (стр. 142)",
  },
  {
    id: "s2",
    category: "out-of-base",
    title: "Вне корпуса",
    question: "Напиши рецепт яблочного пирога",
    description: "Бот должен отказать — нет в технических книгах",
  },
  {
    id: "s3",
    category: "conflict",
    title: "Конфликт фактов",
    question: "Какой размер чанка лучше использовать для RAG?",
    description: "Корпус против общих советов LLM (1000/150 vs 512/256)",
  },
]

const CATEGORY_STYLE = {
  "in-base": {
    icon: <ShieldCheck className="h-4 w-4" />,
    color: "text-emerald-400",
    ring: "hover:border-emerald-500/40 hover:bg-emerald-500/5",
  },
  "out-of-base": {
    icon: <ShieldAlert className="h-4 w-4" />,
    color: "text-amber-400",
    ring: "hover:border-amber-500/40 hover:bg-amber-500/5",
  },
  "conflict": {
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "text-rose-400",
    ring: "hover:border-rose-500/40 hover:bg-rose-500/5",
  },
}

interface Props {
  onSelect: (question: string) => void
  variant?: "card" | "inline"
}

export function TestScenarios({ onSelect, variant = "card" }: Props) {
  if (variant === "inline") {
    return (
      <div className="flex flex-wrap gap-1.5">
        {SCENARIOS.map((s) => {
          const st = CATEGORY_STYLE[s.category]
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.question)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/20 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground",
                st.ring,
              )}
            >
              <span className={st.color}>{st.icon}</span>
              {s.title}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="grid gap-2.5 sm:grid-cols-3">
      {SCENARIOS.map((s) => {
        const st = CATEGORY_STYLE[s.category]
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.question)}
            className={cn(
              "group flex flex-col items-start gap-2 rounded-xl border border-border/50 bg-card/40 p-3.5 text-left transition-all hover:shadow-md",
              st.ring,
            )}
          >
            <div className="flex w-full items-center justify-between">
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-muted/40", st.color)}>
                {st.icon}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <div className="text-[13px] font-semibold">{s.title}</div>
            <div className="text-[11px] leading-relaxed text-muted-foreground">{s.description}</div>
            <div className="mt-1 line-clamp-2 text-[11px] italic text-foreground/60">
              «{s.question}»
            </div>
          </button>
        )
      })}
    </div>
  )
}

export { SCENARIOS }
