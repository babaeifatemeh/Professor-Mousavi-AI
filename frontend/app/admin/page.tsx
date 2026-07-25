"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type UserData = {
  id: number;
  full_name: string;
  email: string;
  is_admin: boolean;
};

type DocumentItem = {
  row: number;
  filename: string;
  display_name: string;
  source_type: "book" | "article" | "lecture" | "other";
  source_type_label: string;
  pages: number;
  chunks: number;
  size_kb: number;
  uploaded_at: string;
  uploaded_timestamp: number;
  indexed: boolean;
};

type RegisteredUser = {
  id: number;
  full_name: string;
  email: string;
  is_admin: boolean;
  is_active: boolean;
};

type ToastData = {
  message: string;
  type: "success" | "error" | "info";
};

type ConfirmDialog = {
  title: string;
  message: string;
  confirmText: string;
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api-backend";

export default function AdminPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSourceType, setSelectedSourceType] = useState<
    "book" | "article" | "lecture" | "other"
  >("article");
  const [searchText, setSearchText] = useState("");
  const [editingUser, setEditingUser] = useState<RegisteredUser | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(
    null,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);

  const [dashboard, setDashboard] = useState({
    users: 0,
    active_users: 0,
    inactive_users: 0,
    admin_users: 0,
    documents: 0,
    stored_documents: 0,
    indexed_documents: 0,
    pages: 0,
    chunks: 0,
    conversations: 0,
    messages: 0,
    files_size_kb: 0,
    database_documents_size_kb: 0,
    api_keys: 0,
    gemini_ready: false,
    chroma_ready: false,
    database_ready: false,
    knowledge_ready: false,
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));

    loadDocuments();
    loadDashboard();
    loadUsers();
  }, []);

  function showToast(message: string, type: ToastData["type"] = "info") {
    setToast({ message, type });

    window.setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  async function loadDocuments() {
    try {
      const response = await fetch(`${API_URL}/admin/documents`);
      const data = await response.json();
      setDocuments(data.files || []);
    } catch {
      showToast("خطا در دریافت لیست فایل‌ها.", "error");
    }
  }

  async function loadDashboard() {
    try {
      const response = await fetch(`${API_URL}/admin/dashboard`);
      const data = await response.json();
      setDashboard(data);
    } catch {
      showToast("خطا در دریافت اطلاعات داشبورد.", "error");
    }
  }

  async function loadUsers() {
    try {
      const response = await fetch(`${API_URL}/admin/users`);
      const data = await response.json();
      setUsers(data.users || []);
    } catch {
      showToast("خطا در دریافت لیست کاربران.", "error");
    }
  }

  async function rebuildKnowledgeBase() {
    try {
      setIsRebuilding(true);

      const response = await fetch(`${API_URL}/rebuild-knowledge-base`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(
          data.detail || "بازسازی پایگاه اطلاعاتی ناموفق بود.",
          "error",
        );
        return;
      }

      showToast(
        `${data.message} تعداد فایل‌ها: ${data.files_processed ?? 0} | بخش‌های ذخیره‌شده: ${data.chunks_saved ?? 0}`,
        "success",
      );

      await loadDocuments();
      await loadDashboard();
    } catch {
      showToast(
        "خطا در ارتباط با سرور هنگام بازسازی پایگاه اطلاعاتی.",
        "error",
      );
    } finally {
      setIsRebuilding(false);
    }
  }

  async function uploadDocument() {
    if (!selectedFile) {
      showToast("ابتدا یک فایل PDF انتخاب کنید.", "error");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("source_type", selectedSourceType);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/admin/upload-document`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };

    xhr.onload = async () => {
      setIsUploading(false);
      setUploadProgress(100);

      try {
        const data = JSON.parse(xhr.responseText || "{}");

        if (xhr.status >= 200 && xhr.status < 300) {
          showToast(data.message || "فایل با موفقیت آپلود شد.", "success");
          setSelectedFile(null);
          setSelectedSourceType("article");
          if (fileInputRef.current) fileInputRef.current.value = "";

          await loadDocuments();
          await loadDashboard();
        } else {
          showToast(
            data.detail || data.message || "آپلود فایل ناموفق بود.",
            "error",
          );
        }
      } catch {
        showToast("پاسخ سرور هنگام آپلود فایل قابل خواندن نبود.", "error");
      }
    };

    xhr.onerror = () => {
      setIsUploading(false);
      setUploadProgress(0);
      showToast("خطا در ارتباط با سرور هنگام آپلود فایل.", "error");
    };

    xhr.send(formData);
  }

  function requestDeleteDocument(item: DocumentItem) {
    setConfirmDialog({
      title: "حذف فایل",
      message: `آیا از حذف این فایل مطمئن هستید؟\n${item.display_name}\n\nنام فایل: ${item.filename}`,
      confirmText: "حذف فایل",
      danger: true,
      onConfirm: async () => {
        try {
          const response = await fetch(
            `${API_URL}/admin/delete-document/${encodeURIComponent(item.filename)}`,
            { method: "DELETE" },
          );

          const data = await response.json();

          if (!response.ok) {
            showToast(data.detail || "حذف فایل ناموفق بود.", "error");
            return;
          }

          showToast(data.message || "فایل با موفقیت حذف شد.", "success");
          await loadDocuments();
          await loadDashboard();
        } catch {
          showToast("خطا در ارتباط با سرور هنگام حذف فایل.", "error");
        }
      },
    });
  }

  function requestDeleteUser(item: RegisteredUser) {
    setConfirmDialog({
      title: "حذف کاربر",
      message: `آیا از حذف این کاربر مطمئن هستید؟\n\n${item.full_name}\n${item.email}\n\nبا حذف کاربر، گفتگوهای مربوط به او هم حذف می‌شود.`,
      confirmText: "حذف کاربر",
      danger: true,
      onConfirm: async () => {
        try {
          const response = await fetch(
            `${API_URL}/auth/admin/users/${item.id}`,
            {
              method: "DELETE",
            },
          );

          const data = await response.json();

          if (!response.ok) {
            showToast(data.detail || "حذف کاربر ناموفق بود.", "error");
            return;
          }

          showToast(data.message || "کاربر حذف شد.", "success");
          await loadUsers();
          await loadDashboard();
        } catch {
          showToast("خطا در ارتباط با سرور هنگام حذف کاربر.", "error");
        }
      },
    });
  }

  async function runConfirmAction() {
    if (!confirmDialog) return;

    const action = confirmDialog.onConfirm;
    setConfirmDialog(null);
    await action();
  }

  async function saveUserEdit() {
    if (!editingUser) return;

    if (!editingUser.full_name.trim() || !editingUser.email.trim()) {
      showToast("نام و ایمیل نباید خالی باشد.", "error");
      return;
    }

    try {
      setIsSavingUser(true);

      const response = await fetch(
        `${API_URL}/auth/admin/users/${editingUser.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: editingUser.full_name,
            email: editingUser.email,
            is_admin: editingUser.is_admin,
            is_active: editingUser.is_active,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        showToast(data.detail || "ویرایش کاربر ناموفق بود.", "error");
        return;
      }

      showToast(data.message || "مشخصات کاربر ویرایش شد.", "success");
      setEditingUser(null);

      await loadUsers();
      await loadDashboard();
    } catch {
      showToast("خطا در ارتباط با سرور هنگام ویرایش کاربر.", "error");
    } finally {
      setIsSavingUser(false);
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    const search = searchText.toLowerCase().trim();

    if (!search) return true;

    return (
      doc.display_name.toLowerCase().includes(search) ||
      doc.filename.toLowerCase().includes(search) ||
      doc.source_type_label.toLowerCase().includes(search)
    );
  });

  if (!user) {
    return (
      <main dir="rtl" className="min-h-screen bg-[#eef8ef] px-6 py-10">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-xl">
          لطفاً ابتدا وارد شوید.
        </div>
      </main>
    );
  }

  if (!user.is_admin) {
    return (
      <main dir="rtl" className="min-h-screen bg-[#eef8ef] px-6 py-10">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-xl">
          شما دسترسی مدیر ندارید.
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#eef8ef] px-6 py-10 text-green-950"
    >
      {toast && (
        <div
          className={`fixed left-1/2 top-6 z-[60] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-2xl px-5 py-4 text-center font-bold shadow-2xl ${
            toast.type === "success"
              ? "bg-green-700 text-white"
              : toast.type === "error"
                ? "bg-red-600 text-white"
                : "bg-green-950 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="mx-auto max-w-6xl">

         <div className="mb-4 flex justify-end">
            <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-green-200 bg-white px-4 py-2 text-sm font-bold text-green-800 shadow-sm transition hover:bg-green-50"
            >
               ← بازگشت به سایت
            </Link>
       </div>

        <h1 className="mb-8 text-4xl font-extrabold text-green-900">
          پنل مدیریت
        </h1>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 shadow-xl shadow-green-100">
            <h2 className="text-lg font-bold text-green-900">کاربران</h2>
            <p className="mt-3 text-3xl font-extrabold text-green-950">
              {dashboard.users}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              فعال: {dashboard.active_users} | مدیر: {dashboard.admin_users} | غیرفعال: {dashboard.inactive_users}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-xl shadow-green-100">
            <h2 className="text-lg font-bold text-green-900">گفتگوها</h2>
            <p className="mt-3 text-3xl font-extrabold text-green-950">
              {dashboard.conversations}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              {dashboard.messages} پیام ذخیره‌شده
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-xl shadow-green-100">
            <h2 className="text-lg font-bold text-green-900">منابع درسی</h2>
            <p className="mt-3 text-3xl font-extrabold text-green-950">
              {dashboard.documents}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              {dashboard.pages} صفحه | {dashboard.files_size_kb} KB
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-xl shadow-green-100">
            <h2 className="text-lg font-bold text-green-900">پایگاه دانش</h2>
            <p className="mt-3 text-3xl font-extrabold text-green-950">
              {dashboard.chunks}
            </p>
            <p
              className={`mt-2 text-sm font-bold ${
                dashboard.knowledge_ready ? "text-green-700" : "text-red-600"
              }`}
            >
              {dashboard.knowledge_ready
                ? "🟢 آماده پاسخگویی"
                : "🔴 نیاز به بازسازی"}
            </p>
          </div>
        </div>

        <div className="mb-8 rounded-3xl bg-white p-6 shadow-xl shadow-green-100">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-green-900">وضعیت سیستم</h2>
              <p className="mt-2 text-sm text-gray-600">
                نمای کلی سلامت سامانه، دیتابیس، موتور هوشمند و فایل‌های پایدار
              </p>
            </div>

            <button
              onClick={rebuildKnowledgeBase}
              disabled={isRebuilding}
              className="cursor-pointer rounded-xl bg-green-800 px-5 py-3 font-bold text-white transition hover:bg-green-900 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isRebuilding ? "در حال بازسازی..." : "🔄 بازسازی پایگاه دانش"}
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
              <div className="text-sm font-bold text-green-900">Gemini API</div>
              <div className="mt-2 text-lg font-extrabold text-green-950">
                {dashboard.gemini_ready ? "🟢 فعال" : "🔴 غیرفعال"}
              </div>
              <div className="mt-1 text-xs text-gray-600">
                {dashboard.api_keys} کلید فعال در سرور
              </div>
            </div>

            <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
              <div className="text-sm font-bold text-green-900">Supabase Database</div>
              <div className="mt-2 text-lg font-extrabold text-green-950">
                {dashboard.database_ready ? "🟢 متصل" : "🔴 خطا"}
              </div>
              <div className="mt-1 text-xs text-gray-600">
                {dashboard.stored_documents} فایل پایدار در دیتابیس
              </div>
            </div>

            <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
              <div className="text-sm font-bold text-green-900">ChromaDB</div>
              <div className="mt-2 text-lg font-extrabold text-green-950">
                {dashboard.chroma_ready ? "🟢 آماده" : "🔴 خطا"}
              </div>
              <div className="mt-1 text-xs text-gray-600">
                {dashboard.indexed_documents} فایل ایندکس‌شده
              </div>
            </div>

            <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
              <div className="text-sm font-bold text-green-900">حجم ذخیره‌سازی</div>
              <div className="mt-2 text-lg font-extrabold text-green-950">
                {dashboard.database_documents_size_kb} KB
              </div>
              <div className="mt-1 text-xs text-gray-600">
                فایل‌های PDF ذخیره‌شده در دیتابیس
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-3xl bg-white p-6 shadow-xl shadow-green-100">
          <h2 className="mb-4 text-2xl font-bold text-green-900">
            کاربران ثبت‌نام‌شده
          </h2>

          <div className="space-y-3">
            {users.map((item) => (
              <div
                key={item.id}
                className="grid gap-3 rounded-xl border border-green-100 p-4 md:grid-cols-5 md:items-center"
              >
                <div className="font-bold text-green-950">{item.full_name}</div>

                <div className="text-sm text-gray-600">{item.email}</div>

                <div className="text-sm font-bold">
                  {item.is_admin ? "👑 مدیر" : "👤 کاربر"}
                </div>

                <div className="text-sm font-bold">
                  {item.is_active ? "🟢 فعال" : "🔴 غیرفعال"}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingUser(item)}
                    className="cursor-pointer rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm font-bold text-green-800 transition hover:bg-green-100"
                  >
                    ✏️ ویرایش
                  </button>

                  <button
                    onClick={() => requestDeleteUser(item)}
                    className="cursor-pointer rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100"
                  >
                    🗑 حذف
                  </button>
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div className="rounded-xl border border-dashed border-green-200 p-6 text-center text-gray-500">
                هنوز کاربری ثبت‌نام نکرده است.
              </div>
            )}
          </div>
        </div>

        <div className="mb-8 rounded-3xl bg-white p-6 shadow-xl shadow-green-100">
          <h2 className="mb-4 text-2xl font-bold text-green-900">
            آپلود منبع جدید
          </h2>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            disabled={isUploading}
          />

          <div className="mb-4 max-w-md">
            <label className="mb-2 block text-sm font-bold text-green-900">
              نوع منبع
            </label>
            <select
              value={selectedSourceType}
              onChange={(e) =>
                setSelectedSourceType(
                  e.target.value as "book" | "article" | "lecture" | "other",
                )
              }
              disabled={isUploading}
              className="w-full rounded-xl border border-green-200 bg-white px-4 py-3 outline-none focus:border-green-700 disabled:bg-gray-100"
            >
              <option value="article">مقاله سایت</option>
              <option value="book">کتاب</option>
              <option value="lecture">درس‌گفتار یا جزوه</option>
              <option value="other">سایر منابع</option>
            </select>
            <p className="mt-2 text-xs leading-6 text-gray-500">
              این انتخاب در دیتابیس و پایگاه جستجو ذخیره می‌شود و برای نمایش دقیق منابع استفاده خواهد شد.
            </p>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full cursor-pointer rounded-xl border border-green-700 bg-green-50 px-6 py-3 font-bold text-green-900 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400 md:w-auto"
            >
              📎 انتخاب فایل PDF
            </button>

            <button
              onClick={uploadDocument}
              disabled={!selectedFile || isUploading}
              className="w-full rounded-xl bg-green-800 px-6 py-3 font-bold text-white transition hover:bg-green-900 disabled:cursor-not-allowed disabled:bg-gray-300 md:w-auto"
            >
              {isUploading ? "در حال آپلود..." : "آپلود فایل"}
            </button>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            {selectedFile
              ? `فایل انتخاب‌شده: ${selectedFile.name} | نوع منبع: ${
                  selectedSourceType === "book"
                    ? "کتاب"
                    : selectedSourceType === "lecture"
                      ? "درس‌گفتار یا جزوه"
                      : selectedSourceType === "other"
                        ? "سایر منابع"
                        : "مقاله سایت"
                }`
              : "هنوز فایلی انتخاب نشده است."}
          </p>

          {isUploading && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-sm font-bold text-green-900">
                <span>در حال آپلود فایل...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-green-100">
                <div
                  className="h-full rounded-full bg-green-800 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-xl shadow-green-100">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-green-900">
              فایل‌های موجود
            </h2>

            <span className="rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-green-800">
              {filteredDocuments.length} از {documents.length} فایل
            </span>
          </div>

          <input
            type="text"
            placeholder="🔍 جستجو در فایل‌ها..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="mb-4 w-full rounded-xl border border-green-200 px-4 py-3 outline-none focus:border-green-700"
          />

          <div className="space-y-3">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.filename}
                className="flex items-center justify-between gap-4 rounded-xl border border-green-100 p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-green-950">
                    {doc.row}. {doc.display_name}
                  </div>

                  <div className="mt-1 text-xs text-gray-500">
                    فایل: {doc.filename}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="rounded-full bg-green-50 px-3 py-1 font-bold text-green-800">
                      🗂 {doc.source_type_label}
                    </span>
                    <span>📄 {doc.pages} صفحه</span>
                    <span>📑 بخش‌های قابل جستجو: {doc.chunks}</span>
                    <span>💾 {doc.size_kb} KB</span>
                    <span>🕒 {doc.uploaded_at}</span>
                    <span>
                      {doc.indexed ? "🟢 آماده پاسخگویی" : "🟠 نیاز به بازسازی"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => requestDeleteDocument(doc)}
                  className="cursor-pointer rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100"
                >
                  🗑 حذف
                </button>
              </div>
            ))}

            {filteredDocuments.length === 0 && (
              <div className="rounded-xl border border-dashed border-green-200 p-6 text-center text-gray-500">
                فایلی با این جستجو پیدا نشد.
              </div>
            )}
          </div>
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="mb-5 text-2xl font-extrabold text-green-900">
              ویرایش کاربر
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-green-900">
                  نام و نام خانوادگی
                </label>
                <input
                  value={editingUser.full_name}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      full_name: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-green-200 px-4 py-3 outline-none focus:border-green-700"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-green-900">
                  ایمیل
                </label>
                <input
                  value={editingUser.email}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, email: e.target.value })
                  }
                  dir="ltr"
                  className="w-full rounded-xl border border-green-200 px-4 py-3 text-left outline-none focus:border-green-700"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-green-100 p-4">
                <input
                  type="checkbox"
                  checked={editingUser.is_admin}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      is_admin: e.target.checked,
                    })
                  }
                />
                <span className="font-bold text-green-900">
                  این کاربر مدیر باشد
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-green-100 p-4">
                <input
                  type="checkbox"
                  checked={editingUser.is_active}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      is_active: e.target.checked,
                    })
                  }
                />
                <span className="font-bold text-green-900">
                  حساب کاربر فعال باشد
                </span>
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 cursor-pointer rounded-xl border border-gray-300 px-5 py-3 font-bold text-gray-700 transition hover:bg-gray-50"
              >
                انصراف
              </button>

              <button
                onClick={saveUserEdit}
                disabled={isSavingUser}
                className="flex-1 cursor-pointer rounded-xl bg-green-800 px-5 py-3 font-bold text-white transition hover:bg-green-900 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {isSavingUser ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-2xl font-extrabold text-green-900">
              {confirmDialog.title}
            </h2>

            <p className="whitespace-pre-line text-sm leading-7 text-gray-700">
              {confirmDialog.message}
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 cursor-pointer rounded-xl border border-gray-300 px-5 py-3 font-bold text-gray-700 transition hover:bg-gray-50"
              >
                انصراف
              </button>

              <button
                onClick={runConfirmAction}
                className={`flex-1 cursor-pointer rounded-xl px-5 py-3 font-bold text-white transition ${
                  confirmDialog.danger
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-800 hover:bg-green-900"
                }`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
