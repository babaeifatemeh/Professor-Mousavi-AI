import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function AuthHeader() {
  return (
    <header className="mx-auto mb-8 max-w-4xl rounded-3xl border border-green-100 bg-white/90 px-8 py-6 shadow-xl shadow-green-200/50">
      <Link href="/" className="flex items-center gap-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-green-200 bg-green-50">
          <BookOpen size={32} className="text-green-700" />
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-green-900">
            مؤسسه فرهنگی قرآن و عترت حکمةٌ صافیه
          </h1>

          <p className="mt-2 text-sm text-green-800">
            مؤسس: استاد علامه دکتر سید علی موسوی(ره)
          </p>
        </div>
      </Link>
    </header>
  );
}