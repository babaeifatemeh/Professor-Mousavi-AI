"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";
import KnowledgeStatus from "@/components/KnowledgeStatus";
import FeatureCards from "@/components/FeatureCards";
import SearchBox from "@/components/SearchBox";
import Hero from "@/components/Hero";
import ConversationSidebar from "@/components/ConversationSidebar";

type UserData = {
  id: number;
  full_name: string;
  email: string;
  is_admin: boolean;
};

export default function Home() {
  const [user, setUser] = useState<UserData | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }
  }, []);

  return (
    <main dir="rtl" className="min-h-screen overflow-x-hidden bg-[#eef8ef] text-[#063f25]">
      <div className="relative min-h-screen px-4 py-5 sm:px-6 md:px-10 md:py-8">
        <div className="pointer-events-none absolute -left-24 top-72 h-96 w-96 rounded-full border border-green-200/30 opacity-40" />
        <div className="pointer-events-none absolute -right-20 top-96 h-80 w-80 rounded-full border border-green-200/30 opacity-40" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-64 rounded-t-[50%] bg-green-100/50" />

        
        {user && (
          <div className="relative z-20 mx-auto mt-5 max-w-7xl lg:hidden">
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/95 px-4 py-3 font-bold text-green-900 shadow-lg shadow-green-200/50"
            >
              <History size={18} />
              تاریخچه گفتگوها
            </button>
          </div>
        )}

        <div className={`relative mx-auto mt-6 flex max-w-7xl flex-col gap-6 lg:mt-8 lg:flex-row ${historyOpen ? "z-[9998]" : "z-10"}`}>
          <div className="min-w-0 flex-1">
            <Hero />

            <SearchBox
              userId={user?.id ?? null}
              activeConversationId={activeConversationId}
              onConversationSaved={(conversationId) => {
                setActiveConversationId(conversationId);
                setRefreshKey((prev) => prev + 1);
              }}
            />

            <FeatureCards />
            <KnowledgeStatus />
           </div>

          {user && (
            <ConversationSidebar
              userId={user.id}
              activeConversationId={activeConversationId}
              refreshKey={refreshKey}
              isMobileOpen={historyOpen}
              onCloseMobile={() => setHistoryOpen(false)}
              onNewChat={() => setActiveConversationId(null)}
              onSelectConversation={(conversationId) =>
                setActiveConversationId(conversationId)
              }
            />
          )}
        </div>
      </div>
    </main>
  );
}
