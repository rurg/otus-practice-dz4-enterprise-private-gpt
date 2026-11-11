"use client"

import * as React from "react"
import { ShieldCheck, Loader2 } from "lucide-react"
import { useChatStore } from "@/store/chat-store"
import { fetchStatus, fetchDocuments } from "@/lib/rag/api"
import type { SystemStatus, IndexedDocument, DocumentChunk } from "@/lib/rag/types"
import { ChatHeader } from "@/components/rag/chat-header"
import { ChatSidebar } from "@/components/rag/chat-sidebar"
import { ChatMessages } from "@/components/rag/chat-messages"
import { ChatInput } from "@/components/rag/chat-input"
import { RightPanel } from "@/components/rag/right-panel"
import { ChatFooter } from "@/components/rag/chat-footer"
import { useRagChat } from "@/components/rag/use-rag-chat"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export default function Home() {
  const [mounted, setMounted] = React.useState(false)
  const [status, setStatus] = React.useState<SystemStatus | null>(null)
  const [statusLoading, setStatusLoading] = React.useState(true)
  const [documents, setDocuments] = React.useState<IndexedDocument[]>([])
  const [forceRightTab, setForceRightTab] = React.useState<"sources" | "settings" | undefined>()
  const [pinnedSources, setPinnedSources] = React.useState<DocumentChunk[] | null>(null)

  const leftPanelOpen = useChatStore((s) => s.leftPanelOpen)
  const rightPanelOpen = useChatStore((s) => s.rightPanelOpen)

  const [isLg, setIsLg] = React.useState(true)
  const [isXl, setIsXl] = React.useState(true)

  const { send, stop, streaming } = useRagChat()

  const handleSend = React.useCallback((q: string) => {
    setPinnedSources(null)
    send(q)
  }, [send])

  // First-mount setup: close panels that can't be columns on small screens.
  React.useEffect(() => {
    setMounted(true)
    const w = window.innerWidth
    const s = useChatStore.getState()
    const patch: Partial<Pick<typeof s, "leftPanelOpen" | "rightPanelOpen">> = {}
    if (w < 1024 && s.leftPanelOpen) patch.leftPanelOpen = false
    if (w < 1280 && s.rightPanelOpen) patch.rightPanelOpen = false
    if (Object.keys(patch).length) useChatStore.setState(patch)
    setIsLg(w >= 1024)
    setIsXl(w >= 1280)

    const onResize = () => {
      setIsLg(window.innerWidth >= 1024)
      setIsXl(window.innerWidth >= 1280)
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  // Fetch status + documents
  const loadStatus = React.useCallback(async () => {
    try {
      const s = await fetchStatus()
      setStatus(s)
    } catch {
      // ignore
    } finally {
      setStatusLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (!mounted) return
    loadStatus()
    fetchDocuments()
      .then(setDocuments)
      .catch(() => {})
    const id = setInterval(loadStatus, 20000)
    return () => clearInterval(id)
  }, [mounted, loadStatus])

  const handleShowSources = React.useCallback((sources: DocumentChunk[]) => {
    setPinnedSources(sources)
    useChatStore.setState({ rightPanelOpen: true })
    setForceRightTab("sources")
    setTimeout(() => setForceRightTab(undefined), 200)
  }, [])

  if (!mounted) {
    return <LoadingShell />
  }

  return (
    <div className="app-bg flex h-dvh flex-col">
      <ChatHeader status={status} statusLoading={statusLoading} />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* ===== Left panel: conversations + KB ===== */}
        <aside
          className={cn(
            "hidden shrink-0 border-r border-border/60 bg-sidebar lg:flex",
            leftPanelOpen ? "lg:w-72 xl:w-72" : "lg:hidden",
          )}
        >
          <ChatSidebar status={status} documents={documents} />
        </aside>

        {/* Mobile drawer for left panel */}
        <Sheet
          open={leftPanelOpen && !isLg}
          onOpenChange={(o) => useChatStore.setState({ leftPanelOpen: o })}
        >
          <SheetContent side="left" className="w-72 p-0">
            <ChatSidebar status={status} documents={documents} />
          </SheetContent>
        </Sheet>

        {/* ===== Main chat column ===== */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <ChatMessages onShowSources={handleShowSources} onSend={handleSend} />
          <ChatInput onSend={handleSend} onStop={stop} streaming={streaming} />
        </main>

        {/* ===== Right panel: sources + settings ===== */}
        <aside
          className={cn(
            "hidden shrink-0 border-l border-border/60 bg-card/30 xl:flex",
            rightPanelOpen ? "xl:w-80" : "xl:hidden",
          )}
        >
          <RightPanel forceTab={forceRightTab} sources={pinnedSources ?? undefined} />
        </aside>

        {/* Drawer for right panel on lg and below */}
        <Sheet
          open={rightPanelOpen && !isXl}
          onOpenChange={(o) => useChatStore.setState({ rightPanelOpen: o })}
        >
          <SheetContent side="right" className="w-80 p-0 sm:max-w-sm">
            <RightPanel forceTab={forceRightTab} sources={pinnedSources ?? undefined} />
          </SheetContent>
        </Sheet>
      </div>

      <ChatFooter status={status} statusLoading={statusLoading} />
    </div>
  )
}

function LoadingShell() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-background">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/12 ring-1 ring-primary/25">
        <ShieldCheck className="h-6 w-6 text-primary" />
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Инициализация защищённого окружения…
      </div>
    </div>
  )
}
