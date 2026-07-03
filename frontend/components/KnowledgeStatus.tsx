"use client";

import { useEffect, useState } from "react";

type KnowledgeStatusData = {
  documents_count: number;
  chunks_count: number;
  files: string[];
};

export default function KnowledgeStatus() {
  const [status, setStatus] = useState<KnowledgeStatusData | null>(null);

  useEffect(() => {
    async function loadStatus() {
      const response = await fetch("http://127.0.0.1:8000/knowledge-base-status");
      const data = await response.json();
      setStatus(data);
    }

    loadStatus();
  }, []);

  if (!status) return null;

  return (
    <div className="relative z-10 mx-auto mt-8 max-w-4xl rounded-2xl border border-green-100 bg-white/80 px-6 py-4 text-right shadow-md shadow-green-100">
      <p className="text-sm font-bold text-green-900">
        وضعیت پایگاه اطلاعات
      </p>

      <p className="mt-2 text-sm text-gray-600">
        {status.documents_count} منبع درسی و {status.chunks_count} بخش متنی فعال است.
      </p>
    </div>
  );
}