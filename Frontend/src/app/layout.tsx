import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "2PeachGPT— RAG по корпусу технических книг",
  description:
    "RAG-ассистент по корпусу из трёх книг по генеративному ИИ, RAG и LangChain. Эмбеддинги BGE-M3, векторная база Chroma, генерация YandexGPT. Ответы с указанием книги и страницы.",
  keywords: [
    "2PeachGPT", "RAG", "LangChain", "BGE-M3", "Chroma", "YandexGPT",
    "корпус книг", "OTUS", "Enterprise 2PeachGPT",
  ],
  authors: [{ name: "OTUS DZ4" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
