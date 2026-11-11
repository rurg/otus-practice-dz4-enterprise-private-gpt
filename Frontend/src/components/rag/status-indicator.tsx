"use client"

import * as React from "react"
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SystemStatus } from "@/lib/rag/types"

interface Props {
  status: SystemStatus | null
  loading?: boolean
  className?: string
  compact?: boolean
}

export function StatusIndicator({ status, loading, className, compact }: Props) {
  if (loading || !status) {
    return (
      <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {!compact && <span>Проверка статуса…</span>}
      </div>
    )
  }

  const connected = status.connected
  const Icon = connected ? ShieldCheck : ShieldAlert
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="relative flex h-2.5 w-2.5">
        {connected && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 pulse-dot" />
        )}
        <span
          className={cn(
            "relative inline-flex h-2.5 w-2.5 rounded-full",
            connected ? "bg-emerald-400" : "bg-amber-400",
          )}
        />
      </span>
      {!compact && (
        <>
          <Icon className={cn("h-3.5 w-3.5", connected ? "text-emerald-400" : "text-amber-400")} />
          <span className="text-xs font-medium">
            {connected
              ? status.backend === "local-python"
                ? "RAG-пайплайн подключён"
                : "Demo-режим (встроенный движок)"
              : "Бэкенд недоступен"}
          </span>
        </>
      )}
    </div>
  )
}
