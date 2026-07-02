"use client";

import { useEffect, useState } from "react";
import KnowledgeStatus from "@/components/KnowledgeStatus";
import Footer from "@/components/Footer";
import FeatureCards from "@/components/FeatureCards";
import SearchBox from "@/components/SearchBox";
import Header from "@/components/Header";
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
    <main dir="rtl" className="min-h-screen overflow-hidden bg-[#eef8ef] text-[#063f25]">
      <div className="relative min-h-screen px-10 py-8">
        <div className="absolute -left-24 top-72 h-96 w-96 rounded-full border border-green-200/30 opacity-40" />
        <div className="absolute -right-20 top-96 h-80 w-80 rounded-full border border-green-200/30 opacity-40" />
        <div className="absolute bottom-0 left-0 right-0 h-64 rounded-t-[50%] bg-green-100/50" />

        <Header />

        <div className="relative z-10 mx-auto mt-8 flex max-w-7xl gap-6">
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
            <Footer />
          </div>

          {user && (
            <ConversationSidebar
              userId={user.id}
              activeConversationId={activeConversationId}
              refreshKey={refreshKey}
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