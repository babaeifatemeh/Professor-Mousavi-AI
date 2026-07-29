import Link from "next/link";

const footerLinks = [
  { title: "درباره سامانه", href: "/about-system" },
  { title: "درباره ما", href: "/about-us" },
  { title: "ارتباط با ما", href: "/contact" },
  { title: "سایت‌های استاد", href: "/professor-sites" },
  { title: "قوانین استفاده", href: "/site-rules" },
  { title: "اپلیکیشن سامانه", href: "/app" },
];

export default function Footer() {
  return (
    <footer className="relative z-10 mx-auto mt-24 mb-10 max-w-6xl px-4 text-center text-gray-600">
      <div className="h-px w-full bg-green-200" />

      <nav
        className="mt-7 flex flex-wrap items-center justify-center gap-x-2 gap-y-3"
        aria-label="پیوندهای پایین سایت"
      >
        {footerLinks.map((link, index) => (
          <div key={link.href} className="flex items-center">
            <Link
              href={link.href}
              className="px-2 text-sm font-medium text-gray-600 transition-colors duration-200 hover:text-green-700 sm:text-base"
            >
              {link.title}
            </Link>

            {index < footerLinks.length - 1 && (
              <span
                className="hidden text-green-300 sm:inline"
                aria-hidden="true"
              >
                |
              </span>
            )}
          </div>
        ))}
      </nav>

      <p className="mt-7 text-base leading-8 sm:text-lg">
        © تمامی حقوق این سامانه متعلق به مؤسسه حکمةٌ صافیه (مؤسس استاد
        علامه سید علی موسوی (ره)) می‌باشد.
      </p>

      <p className="mt-3 text-sm text-gray-500">
        نسخه آزمایشی سامانه هوشمند مباحث درسی
      </p>
    </footer>
  );
}
