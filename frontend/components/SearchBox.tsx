"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Pencil, RefreshCcw, RotateCcw, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ComposerMode =
  | { type: "normal" }
  | { type: "edit"; userMessageIndex: number }
  | {
      type: "continue" | "rewrite";
      assistantMessageIndex: number;
      originalQuestion: string;
      previousAnswer: string;
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
  const [composerMode, setComposerMode] = useState<ComposerMode>({ type: "normal" });
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    async function loadMessages() {
      if (!activeConversationId) {
        setMessages([]);
        setComposerMode({ type: "normal" });
        setMessage("");
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/conversations/${activeConversationId}/messages`
        );

        if (!response.ok) throw new Error("Unable to load conversation.");

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

  useEffect(() => {
    if (composerMode.type !== "normal") inputRef.current?.focus();
  }, [composerMode]);

  async function saveConversation(question: string, answer: string) {
    if (!userId) return;

    const response = await fetch(`${API_URL}/conversations/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        question,
        answer,
        conversation_id: activeConversationId,
      }),
    });

    if (!response.ok) return;
    const data = await response.json();
    if (data.conversation_id) onConversationSaved(data.conversation_id);
  }

  function findPreviousUserQuestion(assistantIndex: number) {
    for (let index = assistantIndex - 1; index >= 0; index -= 1) {
      if (messages[index]?.role === "user") return messages[index].content;
    }
    return "";
  }

  function beginEdit(userMessageIndex: number) {
    const selectedMessage = messages[userMessageIndex];
    if (!selectedMessage || selectedMessage.role !== "user" || loading) return;

    setComposerMode({ type: "edit", userMessageIndex });
    setMessage(selectedMessage.content);
  }

  function beginContextAction(
    type: "continue" | "rewrite",
    assistantMessageIndex: number
  ) {
    const assistantMessage = messages[assistantMessageIndex];
    if (!assistantMessage || assistantMessage.role !== "assistant" || loading) return;

    setComposerMode({
      type,
      assistantMessageIndex,
      originalQuestion: findPreviousUserQuestion(assistantMessageIndex),
      previousAnswer: assistantMessage.content,
    });

    setMessage(
      type === "continue"
        ? "این پاسخ را کامل‌تر کن و بخش‌های ناقص را با استفاده از منابع استاد گسترش بده."
        : "این پاسخ را منسجم‌تر، دقیق‌تر و حرفه‌ای‌تر بازنویسی کن."
    );
  }

  function cancelComposerMode() {
    setComposerMode({ type: "normal" });
    setMessage("");
  }

  function buildBackendPrompt(visibleRequest: string) {
    if (composerMode.type === "continue") {
      return `درخواست کاربر ادامه و تکمیل همان پاسخ قبلی است.\n\nپرسش اصلی:\n${composerMode.originalQuestion}\n\nپاسخ قبلی:\n${composerMode.previousAnswer}\n\nدرخواست جدید کاربر:\n${visibleRequest}\n\nدستور:\nپاسخ قبلی را مبنا قرار بده، آن را تکرار نکن، بخش‌های درخواستی را با جستجوی دوباره در منابع استاد کامل کن و یک نسخه کامل و یکپارچه ارائه بده. فقط منابعی را در پایان ذکر کن که واقعاً در نسخه جدید استفاده شده‌اند.`;
    }

    if (composerMode.type === "rewrite") {
      return `کاربر می‌خواهد همان پاسخ قبلی بازنویسی شود.\n\nپرسش اصلی:\n${composerMode.originalQuestion}\n\nپاسخ قبلی:\n${composerMode.previousAnswer}\n\nدرخواست جدید کاربر:\n${visibleRequest}\n\nدستور:\nمحتوا را با حفظ امانت در مطالب استاد، منسجم‌تر، دقیق‌تر و حرفه‌ای‌تر بازنویسی کن. در صورت نیاز دوباره منابع را جستجو کن و فقط منابع واقعاً استفاده‌شده را ذکر کن.`;
    }

    return visibleRequest;
  }

  async function copyAnswer(content: string, index: number) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      window.setTimeout(() => setCopiedIndex(null), 1800);
    } catch {
      setCopiedIndex(null);
    }
  }

  async function sendMessage() {
    const visibleQuestion = message.trim();
    if (!visibleQuestion || loading) return;

    const backendQuestion = buildBackendPrompt(visibleQuestion);
    let nextMessages = [...messages];

    if (composerMode.type === "edit") {
      nextMessages = messages.slice(0, composerMode.userMessageIndex);
    }

    nextMessages = [
      ...nextMessages,
      { role: "user", content: visibleQuestion },
      { role: "assistant", content: "" },
    ];

    setMessages(nextMessages);
    setMessage("");
    setComposerMode({ type: "normal" });
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat-stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: backendQuestion }),
      });

      if (!response.ok) throw new Error("Server response was not successful.");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("Streaming response is unavailable.");

      let fullAnswer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        fullAnswer += decoder.decode(value, { stream: true });

        setMessages((previousMessages) => {
          const updated = [...previousMessages];
          updated[updated.length - 1] = {
            role: "assistant",
            content: fullAnswer,
          };
          return updated;
        });
      }

      await saveConversation(visibleQuestion, fullAnswer);
    } catch {
      setMessages((previousMessages) => {
        const updated = [...previousMessages];
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

  const modeLabel =
    composerMode.type === "edit"
      ? "ویرایش درخواست قبلی"
      : composerMode.type === "continue"
        ? "تکمیل همان پاسخ"
        : composerMode.type === "rewrite"
          ? "بازنویسی همان پاسخ"
          : null;

  return (
    <section className="relative z-10 mx-auto mt-8 w-full max-w-4xl sm:mt-10">
      <div className="space-y-5 sm:space-y-8">
        {messages.map((item, index) => (
          <div key={`${item.role}-${index}`} className="w-full">
            {item.role === "user" ? (
              <div className="mb-3 text-right">
                <div className="inline-flex max-w-full items-start gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium leading-8 text-green-950 shadow-sm sm:max-w-3xl sm:px-5 sm:text-base">
                  <span>{item.content}</span>
                  <button
                    type="button"
                    onClick={() => beginEdit(index)}
                    disabled={loading}
                    className="mt-1 rounded-full p-1.5 text-green-700 opacity-70 transition hover:bg-green-50 hover:opacity-100 disabled:opacity-30"
                    aria-label="ویرایش درخواست"
                    title="ویرایش درخواست"
                  >
                    <Pencil size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <article className="rounded-3xl border border-green-100 bg-white px-4 py-5 text-right leading-8 text-gray-800 shadow-lg shadow-green-100/70 sm:px-8 sm:py-7 sm:leading-9">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="mb-5 text-xl font-extrabold leading-9 text-green-900 sm:mb-6 sm:text-2xl">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="mb-3 mt-6 text-lg font-bold leading-9 text-green-800 sm:mt-7 sm:text-xl">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="mb-3 mt-5 text-base font-bold leading-8 text-green-800 sm:mt-6 sm:text-lg">{children}</h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-4 text-sm leading-8 sm:mb-5 sm:text-base sm:leading-9">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-5 list-inside list-disc space-y-2">{children}</ul>
                    ),
                    li: ({ children }) => <li className="leading-8">{children}</li>,
                  }}
                >
                  {item.content || "در حال تولید پاسخ..."}
                </ReactMarkdown>

                {item.content && (
                  <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-green-100 pt-4">
                    <button
                      type="button"
                      onClick={() => beginContextAction("continue", index)}
                      disabled={loading}
                      className="inline-flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-sm font-bold text-green-800 transition hover:bg-green-100 disabled:opacity-40"
                    >
                      <RotateCcw size={16} />
                      ادامه و تکمیل
                    </button>

                    <button
                      type="button"
                      onClick={() => beginContextAction("rewrite", index)}
                      disabled={loading}
                      className="inline-flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-sm font-bold text-green-800 transition hover:bg-green-100 disabled:opacity-40"
                    >
                      <RefreshCcw size={16} />
                      بازنویسی
                    </button>

                    <button
                      type="button"
                      onClick={() => copyAnswer(item.content, index)}
                      className="inline-flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-sm font-bold text-green-800 transition hover:bg-green-100"
                    >
                      {copiedIndex === index ? <Check size={16} /> : <Copy size={16} />}
                      {copiedIndex === index ? "کپی شد" : "کپی"}
                    </button>
                  </div>
                )}
              </article>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 sm:mt-8">
        {modeLabel && (
          <div className="mb-2 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
            <span className="font-bold">{modeLabel}</span>
            <button
              type="button"
              onClick={cancelComposerMode}
              className="rounded-full p-1 transition hover:bg-amber-100"
              aria-label="لغو"
              title="لغو"
            >
              <X size={17} />
            </button>
          </div>
        )}

        <div className="flex items-end rounded-2xl border border-green-600 bg-white px-3 py-3 shadow-lg shadow-green-200/60 sm:px-7 sm:py-5">
          <button
            type="button"
            onClick={sendMessage}
            disabled={loading}
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-green-800 text-white transition hover:bg-green-900 disabled:cursor-not-allowed disabled:bg-gray-300 sm:h-11 sm:w-11"
            aria-label="ارسال"
          >
            ↑
          </button>

          <textarea
            ref={inputRef}
            value={message}
            rows={1}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
            className="max-h-48 min-h-11 w-full min-w-0 resize-none bg-transparent px-3 py-2 text-right text-base text-gray-700 outline-none placeholder:text-gray-400 sm:px-6 sm:text-lg"
            placeholder={
              composerMode.type === "continue"
                ? "بگویید کدام بخش همین پاسخ کامل‌تر شود..."
                : composerMode.type === "rewrite"
                  ? "شیوه بازنویسی را مشخص کنید..."
                  : "سؤال یا درخواست خود را وارد نمایید..."
            }
          />
        </div>
      </div>
    </section>
  );
}
