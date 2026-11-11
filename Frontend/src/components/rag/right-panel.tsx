"use client"

import * as React from "react"
import { FileStack, Sliders } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { SourcesPanel } from "./sources-panel"
import { SettingsPanel } from "./settings-panel"
import { useChatStore, activeConversation } from "@/store/chat-store"
import type { DocumentChunk } from "@/lib/rag/types"

interface Props {
  forceTab?: "sources" | "settings"
  sources?: DocumentChunk[]
}

export function RightPanel({ forceTab, sources: pinnedSources }: Props) {
  const conv = useChatStore(activeConversation)
  const lastAssistant = [...(conv?.messages || [])].reverse().find(
    (m) => m.role === "assistant" && m.sources,
  )
  const sources = pinnedSources ?? lastAssistant?.sources ?? []
  const [tab, setTab] = React.useState<"sources" | "settings">("sources")

  React.useEffect(() => {
    if (forceTab) setTab(forceTab)
  }, [forceTab])

  // Auto-switch to sources when a new answer arrives with sources.
  const sourcesCount = sources.length
  const lastMsgId = lastAssistant?.id
  React.useEffect(() => {
    if (sourcesCount > 0 && lastMsgId) setTab("sources")
  }, [sourcesCount, lastMsgId])

  return (
    <div className="flex h-full flex-col">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "sources" | "settings")} className="flex h-full flex-col">
        <div className="flex items-center gap-1 border-b border-border/60 px-2 py-2">
          <TabsList className="h-8 bg-muted/40 p-0.5">
            <TabsTrigger value="sources" className="gap-1.5 px-2.5 text-xs">
              <FileStack className="h-3.5 w-3.5" />
              Источники
              {sourcesCount > 0 && (
                <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[9px]">
                  {sourcesCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5 px-2.5 text-xs">
              <Sliders className="h-3.5 w-3.5" />
              Параметры
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="sources" className="mt-0 flex-1 overflow-hidden">
          <SourcesPanel sources={sources} />
        </TabsContent>
        <TabsContent value="settings" className="mt-0 flex-1 overflow-hidden">
          <SettingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
