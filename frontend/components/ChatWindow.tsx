"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type Props = {
  userId: number | null;
  activeConversationId: number | null;
  onConversationSaved: (conversationId: number) => void;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function ChatWindow({
  userId,
  activeConversationId,
  onConversationSaved,
}: Props) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadMessages() {
      if (!activeConversationId) {
        setMessages([]);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/conversations/${activeConversationId}/messages`);
        const data = await res.json();

        const normalized: ChatMessage[] = [];

        if (Array.isArray(data)) {
          data.forEach((item) => {
            if (item.question) {
              normalized.push({ role: "user", content: item.question });
            }

            if (item.answer) {
              normalized.push({ role: "assistant", content: item.answer });
            }

            if (item.role && item.content) {
              normalized.push({
                role: item.role === "user" ? "user" : "assistant",
                content: item.content,
              });
            }
          });
        }

        setMessages(normalized);
      } catch {
        setMessages([]);
      }
    }

    loadMessages();
  }, [activeConversationId]);

  async function saveConversation(question: string, answer: string) {
    if (!userId) return;

    const res = await fetch(`${API_URL}/conversations/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        question,
        answer,
        conversation_id: activeConversationId,
      }),
    });

    const data = await res.json();

    if (data.conversation_id) {
      onConversationSaved(data.conversation_id);
    }
  }

  async function sendMessage() {
    const userMessage = message.trim();

    if (!userMessage || loading) return;

    setMessage("");
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
      { role: "assistant", content: "" },
    ]);

    try {
      const response = await fetch(`${API_URL}/chat-stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        setLoading(false);
        return;
      }

      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        fullText += chunk;

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: fullText,
          };
          return updated;
        });
      }

      await saveConversation(userMessage, fullText);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex h-screen flex-1 flex-col bg-[#eef8ef]">
      <div className="border-b border-green-200 bg-white/70 px-8 py-4">
        <h1 className="text-xl font-bold text-green-950">ProfessorAI</h1>
        <p className="text-sm text-green-700">
          دستیار هوشمند آموزشی شما
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-8">
        {messages.length === 0 && (
          <div className="mx-auto mt-20 max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-green-950">
              امروز چه چیزی می‌خواهید بپرسید؟
            </h2>
            <p className="mt-4 text-green-700">
              سؤال خود را بنویسید تا پاسخ بر اساس پایگاه دانش آماده شود.
            </p>
          </div>
        )}

        <div className="mx-auto max-w-4xl space-y-5">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`rounded-3xl px-6 py-5 leading-8 shadow-sm ${
                msg.role === "user"
                  ? "mr-auto max-w-2xl bg-green-800 text-white"
                  : "ml-auto max-w-4xl border border-green-100 bg-white text-gray-800"
              }`}
            >
              {msg.role === "assistant" ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content || "در حال تولید پاسخ..."}
                </ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-green-200 bg-[#eef8ef] px-8 py-5">
        <div className="mx-auto flex max-w-4xl items-center rounded-2xl border border-green-600 bg-white px-5 py-4 shadow-lg shadow-green-200/60">
          <button
            onClick={sendMessage}
            disabled={loading}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-green-800 text-white transition hover:bg-green-900 disabled:opacity-50"
          >
            ↑
          </button>

          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                sendMessage();
              }
            }}
            className="w-full bg-transparent px-5 text-right text-lg text-gray-700 outline-none placeholder:text-gray-400"
            placeholder="سؤال خود را وارد کنید..."
          />
        </div>
      </div>
    </section>
  );
}