"use client"

import * as React from "react"
import { BookMarked, PanelLeft, PanelRight, Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ThemeToggle } from "@/components/theme-toggle"
import { StatusIndicator } from "./status-indicator"
import type { SystemStatus } from "@/lib/rag/types"
import { useChatStore } from "@/store/chat-store"

interface Props {
  status: SystemStatus | null
  statusLoading?: boolean
}

export function ChatHeader({ status, statusLoading }: Props) {
  const leftPanelOpen = useChatStore((s) => s.leftPanelOpen)
  const rightPanelOpen = useChatStore((s) => s.rightPanelOpen)
  const toggleLeft = useChatStore((s) => s.toggleLeftPanel)
  const toggleRight = useChatStore((s) => s.toggleRightPanel)

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border/70 bg-background/80 px-3 backdrop-blur-xl sm:px-4">
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={toggleLeft}
              aria-label="Список диалогов"
            >
              <PanelLeft className={`h-4 w-4 transition-opacity ${leftPanelOpen ? "opacity-100" : "opacity-50"}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Диалоги и корпус книг</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="flex items-center gap-2.5">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 ring-1 ring-primary/25">
          <BookMarked className="h-5 w-5 text-primary" />
        </div>
        <div className="leading-tight">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold tracking-tight">2PeachGPT</span>
            <Badge
              variant="outline"
              className="hidden border-primary/30 bg-primary/10 px-1.5 py-0 text-[10px] font-medium text-primary sm:inline-flex"
            >
              BOOK RAG
            </Badge>
          </div>
          <div className="hidden text-[11px] text-muted-foreground sm:block">
            поиск по корпусу технических книг · RAG
          </div>
        </div>
      </div>

      <div className="ml-2 hidden items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1 md:flex">
        <span className="text-[11px] font-medium text-muted-foreground">
          {status && status.connected
            ? `${status.documentsCount} книг · ${status.chunksCount} чанков`
            : status && !status.connected
              ? "бэкенд недоступен"
              : "загрузка…"}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <StatusIndicator status={status} loading={statusLoading} className="hidden lg:flex" />
        <Button
          variant="ghost"
          size="sm"
          className="hidden h-9 gap-2 text-muted-foreground sm:flex"
          asChild
        >
          <a href="https://github.com/rurg/otus-practice-dz4-enterprise-private-gpt" target="_blank" rel="noreferrer">
            <Github className="h-4 w-4" />
            <span className="text-xs">Repo</span>
          </a>
        </Button>
        <ThemeToggle />
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={toggleRight}
                aria-label="Источники и настройки"
              >
                <PanelRight className={`h-4 w-4 transition-opacity ${rightPanelOpen ? "opacity-100" : "opacity-50"}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Источники и параметры RAG</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  )
}
