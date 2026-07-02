import { FileText, MessageCircle, Search, ClipboardList } from "lucide-react";

const cards = [
  {
    icon: Search,
    title: "جستجو در جزوات و متون درسی",
    text: "جستجوی هوشمند در میان جزوات و منابع درسی استاد برای یافتن پاسخ دقیق",
  },
  {
    icon: MessageCircle,
    title: "پاسخگویی بر اساس منابع استاد",
    text: "پاسخگویی دقیق و مستند بر اساس محتوای اصلی جزوات و کتب استاد",
  },
  {
    icon: FileText,
    title: "تولید خلاصه و مقاله درسی",
    text: "تولید خلاصه، مقاله و مطالب علمی از مباحث درسی بر اساس نیاز شما",
  },
  {
    icon: ClipboardList,
    title: "طراحی سوال از مباحث استاد",
    text: "طراحی سوالات تستی و تشریحی از مباحث استاد جهت ارزیابی و تمرین",
  },
];

export default function FeatureCards() {
  return (
    <div className="relative z-10 mx-auto mt-20 grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;

        return (
          <div
            key={index}
            className="rounded-3xl border border-green-100 bg-white/95 px-6 py-10 text-center shadow-xl shadow-green-200/50 transition hover:-translate-y-1"
          >
            <div className="mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
              <Icon size={40} className="text-green-700" />
            </div>

            <h3 className="text-xl font-extrabold leading-relaxed text-green-900">
              {card.title}
            </h3>

            <p className="mt-5 text-base leading-9 text-gray-600">
              {card.text}
            </p>

            <div className="mx-auto mt-7 h-1 w-12 rounded-full bg-green-500" />
          </div>
        );
      })}
    </div>
  );
}