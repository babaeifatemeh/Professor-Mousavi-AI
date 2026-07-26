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
      if (!userId) {
        setConversations([]);
        return;
      }

      setLoading(true);

      try {
        const response = await fetch(`${API_URL}/conversations/user/${userId}`);

        if (!response.ok) {
          throw new Error("Failed to load conversations");
        }

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

  const conversationList = (
    <div className="space-y-2 pr-1">
      {loading && (
        <p className="rounded-xl bg-green-50 px-3 py-3 text-sm text-gray-500">
          در حال بارگذاری...
        </p>
      )}

      {!loading && conversations.length === 0 && (
        <p className="rounded-xl bg-green-50 px-3 py-3 text-sm leading-6 text-gray-500">
          هنوز گفتگویی ذخیره نشده است.
        </p>
      )}

      {conversations.map((conversation) => (
        <button
          key={conversation.id}
          type="button"
          onClick={() => handleSelectConversation(conversation.id)}
          className={`w-full cursor-pointer rounded-xl px-3 py-3 text-right text-sm transition-colors duration-200 ${
            activeConversationId === conversation.id
              ? "bg-green-800 text-white shadow-sm"
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
  );

  const desktopSidebar = (
    <aside className="hidden w-80 shrink-0 self-start lg:sticky lg:top-6 lg:block">
      <div className="overflow-hidden rounded-3xl border border-green-100 bg-white/90 shadow-xl shadow-green-200/40 backdrop-blur-sm">
        <div className="border-b border-green-100 p-4">
          <button
            type="button"
            onClick={handleNewChat}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-3 font-bold text-white transition-colors duration-200 hover:bg-green-900"
          >
            <MessageSquarePlus size={18} />
            گفتگوی جدید
          </button>

          <h2 className="mt-5 px-2 text-sm font-bold text-green-900">
            تاریخچه گفتگوها
          </h2>
        </div>

        <div className="max-h-[calc(100vh-190px)] overflow-y-auto p-4 scrollbar-thin">
          {conversationList}
        </div>
      </div>
    </aside>
  );

  const mobileDrawer = (
    <div className="fixed inset-0 z-[9999] bg-white lg:hidden" dir="rtl">
      <div className="flex h-full flex-col bg-white">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-green-100 bg-white px-5 py-4 shadow-sm">
          <h2 className="text-lg font-extrabold text-green-900">
            تاریخچه گفتگوها
          </h2>

          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-full bg-green-50 p-2 text-green-900 transition-colors hover:bg-green-100"
            aria-label="بستن تاریخچه"
          >
            <X size={22} />
          </button>
        </div>

        <div className="px-5 py-4">
          <button
            type="button"
            onClick={handleNewChat}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-4 text-base font-bold text-white transition-colors duration-200 hover:bg-green-900"
          >
            <MessageSquarePlus size={20} />
            گفتگوی جدید
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {conversationList}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {desktopSidebar}
      {isMobileOpen && mobileDrawer}
    </>
  );
}
