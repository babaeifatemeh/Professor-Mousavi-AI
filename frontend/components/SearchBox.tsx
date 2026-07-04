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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api-backend";

export default function SearchBox({
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
        const response = await fetch(
          `${API_URL}/conversations/${activeConversationId}/messages`
        );

        const data = await response.json();
        const rawMessages = Array.isArray(data) ? data : data.messages || [];

        const normalized: ChatMessage[] = rawMessages
          .filter((item: any) => item.role && item.content)
          .map((item: any) => ({
            role: item.role === "user" ? "user" : "assistant",
            content: item.content,
          }));

        setMessages(normalized);
      } catch {
        setMessages([]);
      }
    }

    loadMessages();
  }, [activeConversationId]);

  async function saveConversation(question: string, answer: string) {
    if (!userId) return;

    const response = await fetch(`${API_URL}/conversations/save`, {
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

    const data = await response.json();

    if (data.conversation_id) {
      onConversationSaved(data.conversation_id);
    }
  }

  async function sendMessage() {
    const userQuestion = message.trim();

    if (!userQuestion || loading) return;

    setMessage("");
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userQuestion },
      { role: "assistant", content: "" },
    ]);

    try {
      const response = await fetch(`${API_URL}/chat-stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userQuestion }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) return;

      let fullAnswer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        fullAnswer += decoder.decode(value);

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: fullAnswer,
          };
          return updated;
        });
      }

      await saveConversation(userQuestion, fullAnswer);
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "خطا در ارتباط با سرور.",
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative z-10 mx-auto mt-8 w-full max-w-4xl sm:mt-10">
      <div className="space-y-5 sm:space-y-8">
        {messages.map((item, index) => (
          <div key={index} className="w-full">
            {item.role === "user" ? (
              <div className="mb-3 text-right">
                <div className="inline-block max-w-full rounded-2xl bg-white px-4 py-3 text-sm font-medium leading-8 text-green-950 shadow-sm sm:max-w-3xl sm:px-5 sm:text-base">
                  {item.content}
                </div>
              </div>
            ) : (
              <article className="rounded-3xl border border-green-100 bg-white px-4 py-5 text-right leading-8 text-gray-800 shadow-lg shadow-green-100/70 sm:px-8 sm:py-7 sm:leading-9">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="mb-5 text-xl font-extrabold leading-9 text-green-900 sm:mb-6 sm:text-2xl">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="mb-3 mt-6 text-lg font-bold leading-9 text-green-800 sm:mt-7 sm:text-xl">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="mb-3 mt-5 text-base font-bold leading-8 text-green-800 sm:mt-6 sm:text-lg">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-4 text-sm leading-8 sm:mb-5 sm:text-base sm:leading-9">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-5 list-inside list-disc space-y-2">
                        {children}
                      </ul>
                    ),
                    li: ({ children }) => (
                      <li className="leading-8">{children}</li>
                    ),
                  }}
                >
                  {item.content || "در حال تولید پاسخ..."}
                </ReactMarkdown>
              </article>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center rounded-2xl border border-green-600 bg-white px-3 py-3 shadow-lg shadow-green-200/60 sm:mt-8 sm:px-7 sm:py-5">
        <button
          type="button"
          onClick={sendMessage}
          disabled={loading}
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-green-800 text-white transition hover:bg-green-900 disabled:cursor-not-allowed disabled:bg-gray-300 sm:h-11 sm:w-11"
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
          className="w-full min-w-0 bg-transparent px-3 text-right text-base text-gray-700 outline-none placeholder:text-gray-400 sm:px-6 sm:text-lg"
          placeholder="سؤال یا درخواست خود را وارد نمایید..."
        />
      </div>
    </section>
  );
}