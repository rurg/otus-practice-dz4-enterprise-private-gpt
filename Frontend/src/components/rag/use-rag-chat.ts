"use client"

import * as React from "react"
import { useChatStore, activeConversation, uid } from "@/store/chat-store"
import { streamChat } from "@/lib/rag/api"
import type { RagChatChunk } from "@/lib/rag/types"
import { toast } from "@/hooks/use-toast"

export function useRagChat() {
  const conv = useChatStore(activeConversation)
  const newConversation = useChatStore((s) => s.newConversation)
  const addMessage = useChatStore((s) => s.addMessage)
  const updateMessage = useChatStore((s) => s.updateMessage)
  const topK = useChatStore((s) => s.topK)
  const temperature = useChatStore((s) => s.temperature)

  const [streaming, setStreaming] = React.useState(false)
  const abortRef = React.useRef<AbortController | null>(null)

  const send = React.useCallback(
    async (query: string) => {
      const q = query.trim()
      if (!q || streaming) return

      let convId = conv?.id
      if (!convId) convId = newConversation()

      const userMsg = {
        id: uid(),
        role: "user" as const,
        content: q,
        createdAt: Date.now(),
      }
      addMessage(convId, userMsg)

      const assistantId = uid()
      addMessage(convId, {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: Date.now(),
        streaming: true,
      })

      setStreaming(true)
      const controller = new AbortController()
      abortRef.current = controller

      const onChunk = (chunk: RagChatChunk) => {
        switch (chunk.type) {
          case "category":
            if (chunk.category)
              updateMessage(convId!, assistantId, { category: chunk.category })
            break
          case "sources":
            if (chunk.sources)
              updateMessage(convId!, assistantId, { sources: chunk.sources })
            break
          case "token":
            if (chunk.content) {
              // append token: read current content via store getState
              const state = useChatStore.getState()
              const c = state.conversations.find((x) => x.id === convId)
              const m = c?.messages.find((mm) => mm.id === assistantId)
              updateMessage(convId!, assistantId, { content: (m?.content || "") + chunk.content })
            }
            break
          case "metrics":
            if (chunk.metrics)
              updateMessage(convId!, assistantId, { metrics: chunk.metrics })
            break
          case "error":
            updateMessage(convId!, assistantId, {
              content:
                "⚠️ Ошибка при обращении к RAG-пайплайну: " +
                (chunk.message || "неизвестная ошибка"),
              streaming: false,
            })
            setStreaming(false)
            toast({
              title: "Ошибка генерации",
              description: chunk.message || "Попробуйте повторить запрос",
              variant: "destructive",
            })
            break
          case "done":
            updateMessage(convId!, assistantId, { streaming: false })
            setStreaming(false)
            break
        }
      }

      try {
        await streamChat(
          {
            query: q,
            topK,
            temperature,
            conversationId: convId,
          },
          onChunk,
          controller.signal,
        )
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          updateMessage(convId!, assistantId, {
            content: "⚠️ Соединение прервано. Попробуйте ещё раз.",
            streaming: false,
          })
          setStreaming(false)
        }
      } finally {
        abortRef.current = null
      }
    },
    [conv, streaming, newConversation, addMessage, updateMessage, topK, temperature],
  )

  const stop = React.useCallback(() => {
    abortRef.current?.abort()
    setStreaming(false)
  }, [])

  return { send, stop, streaming }
}
