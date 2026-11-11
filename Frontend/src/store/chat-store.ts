"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Conversation, ConversationMessage } from "@/lib/rag/types"

interface ChatState {
  conversations: Conversation[]
  activeId: string | null
  topK: number
  temperature: number
  rightPanelOpen: boolean
  leftPanelOpen: boolean
  // actions
  newConversation: () => string
  setActive: (id: string) => void
  deleteConversation: (id: string) => void
  renameConversation: (id: string, title: string) => void
  addMessage: (id: string, msg: ConversationMessage) => void
  updateMessage: (id: string, msgId: string, patch: Partial<ConversationMessage>) => void
  setTopK: (k: number) => void
  setTemperature: (t: number) => void
  toggleRightPanel: () => void
  toggleLeftPanel: () => void
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeId: null,
      topK: 4,
      temperature: 0.3,
      rightPanelOpen: true,
      leftPanelOpen: true,

      newConversation: () => {
        const id = uid()
        const conv: Conversation = {
          id,
          title: "Новый диалог",
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set((s) => ({ conversations: [conv, ...s.conversations], activeId: id }))
        return id
      },

      setActive: (id) => set({ activeId: id }),

      deleteConversation: (id) =>
        set((s) => {
          const conversations = s.conversations.filter((c) => c.id !== id)
          const activeId = s.activeId === id ? conversations[0]?.id ?? null : s.activeId
          return { conversations, activeId }
        }),

      renameConversation: (id, title) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, title } : c,
          ),
        })),

      addMessage: (id, msg) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id
              ? {
                  ...c,
                  messages: [...c.messages, msg],
                  updatedAt: Date.now(),
                  title:
                    c.title === "Новый диалог" && msg.role === "user"
                      ? msg.content.slice(0, 38) + (msg.content.length > 38 ? "…" : "")
                      : c.title,
                }
              : c,
          ),
        })),

      updateMessage: (id, msgId, patch) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === msgId ? { ...m, ...patch } : m,
                  ),
                }
              : c,
          ),
        })),

      setTopK: (k) => set({ topK: k }),
      setTemperature: (t) => set({ temperature: t }),
      toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
      toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),
    }),
    {
      name: "private-gpt-books",
      partialize: (s) => ({
        conversations: s.conversations,
        activeId: s.activeId,
        topK: s.topK,
        temperature: s.temperature,
      }),
    },
  ),
)

export function activeConversation(s: ChatState): Conversation | null {
  return s.conversations.find((c) => c.id === s.activeId) ?? null
}

export { uid }
