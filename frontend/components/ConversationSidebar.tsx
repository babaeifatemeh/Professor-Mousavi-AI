"use client";

import { useEffect, useState } from "react";
import { MessageSquarePlus, X } from "lucide-react";

type Conversation = {
  id: number;
  title: string;
  created_at: string;
};

type Props = {
  userId: number | null;
  activeConversationId: number | null;
  refreshKey: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onNewChat: () => void;
  onSelectConversation: (conversationId: number) => void;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api-backend";

export default function ConversationSidebar({
  userId,
  activeConversationId,
  refreshKey,
  isMobileOpen = false,
  onCloseMobile,
  onNewChat,
  onSelectConversation,
}: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadConversations() {
      if (!userId) return;

      setLoading(true);

      try {
        const response = await fetch(`${API_URL}/conversations/user/${userId}`);
        const data = await response.json();

        setConversations(Array.isArray(data) ? data : data.conversations || []);
      } catch {
        setConversations([]);
      } finally {
        setLoading(false);
      }
    }

    loadConversations();
  }, [userId, refreshKey]);

  function handleNewChat() {
    onNewChat();
    onCloseMobile?.();
  }

  function handleSelectConversation(conversationId: number) {
    onSelectConversation(conversationId);
    onCloseMobile?.();
  }

  const sidebarContent = (
    <>
      <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
        <h2 className="text-base font-extrabold text-green-900">
          تاریخچه گفتگوها
        </h2>

        <button
          type="button"
          onClick={onCloseMobile}
          className="rounded-full bg-green-50 p-2 text-green-900"
          aria-label="بستن تاریخچه"
        >
          <X size={20} />
        </button>
      </div>

      <button
        type="button"
        onClick={handleNewChat}
        className="mb-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-3 font-bold text-white transition hover:bg-green-900"
      >
        <MessageSquarePlus size={18} />
        گفتگوی جدید
      </button>

      <h2 className="mb-3 hidden px-2 text-sm font-bold text-green-900 lg:block">
        تاریخچه گفتگوها
      </h2>

      <div className="max-h-[calc(100vh-180px)] space-y-2 overflow-y-auto pr-1 lg:max-h-[620px]">
        {loading && (
          <p className="rounded-xl bg-green-50 px-3 py-3 text-sm text-gray-500">
            در حال بارگذاری...
          </p>
        )}

        {!loading && conversations.length === 0 && (
          <p className="rounded-xl bg-green-50 px-3 py-3 text-sm text-gray-500">
            هنوز گفتگویی ذخیره نشده است.
          </p>
        )}

        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            type="button"
            onClick={() => handleSelectConversation(conversation.id)}
            className={`w-full cursor-pointer rounded-xl px-3 py-3 text-right text-sm transition ${
              activeConversationId === conversation.id
                ? "bg-green-800 text-white"
                : "bg-green-50 text-green-950 hover:bg-green-100"
            }`}
          >
            <div className="truncate font-bold">
              {conversation.title || "گفتگوی بدون عنوان"}
            </div>

            <div className="mt-1 text-xs opacity-70">
              {new Date(conversation.created_at).toLocaleString("fa-IR")}
            </div>
          </button>
        ))}
      </div>
    </>
  );

 return (
  <>
    <aside className="hidden w-80 shrink-0 rounded-3xl border border-green-100 bg-white/90 p-4 shadow-xl shadow-green-200/40 lg:block">
      {sidebarContent}
    </aside>

    {isMobileOpen && (
      <div
        className="fixed inset-0 z-[9999] bg-black/40 lg:hidden"
        onClick={onCloseMobile}
      >
        <aside
          className="fixed right-3 top-4 bottom-4 w-[88vw] max-w-sm overflow-y-auto rounded-3xl border border-green-100 bg-white p-4 shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          {sidebarContent}
        </aside>
      </div>
    )}
  </>
);
}
