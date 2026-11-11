"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { cn } from "@/lib/utils"

interface MarkdownProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownProps) {
  return (
    <div className={cn("md-body", className)}>
      <ReactMarkdown
        components={{
          code(props) {
            const { children, className, node, ...rest } = props as {
              children?: React.ReactNode
              className?: string
              node?: unknown
            }
            const match = /language-(\w+)/.exec(className || "")
            const isInline = !match && !String(children).includes("\n")
            if (isInline) {
              return (
                <code className={className} {...rest}>
                  {children}
                </code>
              )
            }
            return (
              <SyntaxHighlighter
                style={oneDark as unknown as never}
                language={match?.[1] || "text"}
                PreTag="div"
                customStyle={{
                  margin: 0,
                  background: "transparent",
                  fontSize: "0.82rem",
                }}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
