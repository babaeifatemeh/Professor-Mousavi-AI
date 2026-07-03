"use client";

import { useEffect, useState } from "react";
import { MessageSquarePlus } from "lucide-react";

type Conversation = {
  id: number;
  title: string;
  created_at: string;
};

type Props = {
  userId: number | null;
  activeConversationId: number | null;
  refreshKey: number;
  onNewChat: () => void;
  onSelectConversation: (conversationId: number) => void;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function ConversationSidebar({
  userId,
  activeConversationId,
  refreshKey,
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

  return (
    <aside className="w-80 shrink-0 rounded-3xl border border-green-100 bg-white/90 p-4 shadow-xl shadow-green-200/40">
      <button
        type="button"
        onClick={onNewChat}
        className="mb-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-3 font-bold text-white transition hover:bg-green-900"
      >
        <MessageSquarePlus size={18} />
        گفتگوی جدید
      </button>

      <h2 className="mb-3 px-2 text-sm font-bold text-green-900">
        تاریخچه گفتگوها
      </h2>

      <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
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
            onClick={() => onSelectConversation(conversation.id)}
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
    </aside>
  );
}