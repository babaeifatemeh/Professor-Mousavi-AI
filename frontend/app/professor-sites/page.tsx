import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Globe2, LibraryBig, BookOpenText } from "lucide-react";

const sites = [
  {
    title: "پایگاه رسمی استاد",
    description:
      "مرجع معرفی آثار، اندیشه‌ها، فعالیت‌های علمی و محتوای مرتبط با استاد علامه سید علی موسوی (ره).",
    href: "https://www.ostad-mosavi.com",
    domain: "ostad-mosavi.com",
    Icon: Globe2,
  },
  {
    title: "قرآن و برهان",
    description:
      "پایگاهی تخصصی برای دسترسی به محتوای قرآنی، پژوهش‌ها، مقالات و مباحث تفسیری.",
    href: "https://www.quranoburhan.ir",
    domain: "quranoburhan.ir",
    Icon: BookOpenText,
  },
  {
    title: "کتابخانه استاد",
    description:
      "دسترسی به مجموعه‌ای از کتاب‌ها، آثار مکتوب و منابع پژوهشی مرتبط با استاد و مؤسسه.",
    href: "https://ostadmousavilibrary.ir",
    domain: "ostadmousavilibrary.ir",
    Icon: LibraryBig,
  },
];

export default function ProfessorSitesPage() {
  return (
    <main dir="rtl" className="overflow-hidden bg-[#fbfaf7] text-[#26372f]">
      <section className="relative overflow-hidden border-b border-[#eadfca] bg-[#fffdf8]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_22%,rgba(216,183,107,0.14),transparent_31%),radial-gradient(circle_at_82%_58%,rgba(0,139,67,0.10),transparent_34%)]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-14 sm:px-10 lg:grid-cols-[1.02fr_0.98fr] lg:px-16 lg:py-20">
          <div className="order-2 lg:order-1">
            <p className="text-[20px] font-extrabold text-[#b88a2f]">
              درگاه‌های رسمی و پژوهشی
            </p>

            <h1 className="mt-3 text-5xl font-black leading-[1.45] text-[#008b43] sm:text-6xl">
              سایت‌های استاد
            </h1>

            <div className="mt-5 flex w-44 items-center gap-3">
              <span className="h-px flex-1 bg-[#d8b76b]" />
              <span className="h-3 w-3 rotate-45 border border-[#b88a2f] bg-[#fffaf0]" />
              <span className="h-px flex-1 bg-[#d8b76b]" />
            </div>

            <p className="mt-7 max-w-2xl text-xl font-bold leading-10 text-[#17693f]">
              دسترسی یکپارچه به پایگاه‌های رسمی، قرآنی و کتابخانه‌ای استاد علامه
              سید علی موسوی (ره)
            </p>

            <p className="mt-5 max-w-2xl text-[17px] leading-9 text-[#5b6861]">
              در این صفحه، پیوندهای اصلی مرتبط با آثار، پژوهش‌ها و منابع علمی
              استاد گردآوری شده‌اند تا کاربران بتوانند از یک مسیر روشن و معتبر
              به محتوای مورد نیاز خود دسترسی پیدا کنند.
            </p>

            <Link
              href="/"
              className="mt-9 inline-flex items-center justify-center rounded-[14px] bg-[#008b43] px-9 py-4 text-base font-extrabold text-white shadow-[0_12px_28px_rgba(0,139,67,0.22)] transition hover:-translate-y-0.5 hover:bg-[#00783a]"
            >
              بازگشت به صفحه اصلی
            </Link>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative overflow-hidden rounded-[28px] border border-[#eadfca] bg-white p-3 shadow-[0_24px_70px_rgba(62,80,69,0.14)]">
              <Image
                src="/professor-mousavi.jpg"
                alt="استاد علامه سید علی موسوی در حال تدریس"
                width={555}
                height={370}
                priority
                className="h-[360px] w-full rounded-[20px] object-cover object-center sm:h-[430px]"
              />

              <div className="absolute inset-x-8 bottom-8 rounded-2xl border border-white/60 bg-white/90 px-5 py-4 text-center shadow-lg backdrop-blur-sm">
                <p className="font-extrabold text-[#08743d]">
                  استاد علامه سید علی موسوی (ره)
                </p>
                <p className="mt-1 text-sm text-[#66736c]">
                  محقق و فیلسوف متأله
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-10 lg:px-16 lg:py-20">
        <div className="text-center">
          <p className="text-[20px] font-extrabold text-[#b88a2f]">
            پایگاه‌های منتخب
          </p>
          <h2 className="mt-3 text-3xl font-black text-[#008b43] sm:text-4xl">
            دسترسی مستقیم به منابع استاد
          </h2>

          <div className="mx-auto mt-5 flex w-40 items-center justify-center gap-3">
            <span className="h-px flex-1 bg-[#d8b76b]" />
            <span className="h-3 w-3 rotate-45 border border-[#b88a2f] bg-[#fffaf0]" />
            <span className="h-px flex-1 bg-[#d8b76b]" />
          </div>
        </div>

        <div className="mt-12 grid gap-7 md:grid-cols-3">
          {sites.map(({ title, description, href, domain, Icon }) => (
            <article
              key={href}
              className="group flex min-h-[360px] flex-col rounded-[26px] border border-[#eadfc9] bg-white px-8 py-9 text-center shadow-[0_18px_42px_rgba(70,82,74,0.08)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_56px_rgba(70,82,74,0.13)]"
            >
              <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-[#d7bb76] bg-[#f9fbf7]">
                <div className="absolute inset-2 rounded-full bg-[#eaf5ee]" />
                <Icon className="relative h-12 w-12 text-[#08743d]" strokeWidth={1.8} />
              </div>

              <h3 className="mt-7 text-[22px] font-black text-[#08743d]">
                {title}
              </h3>

              <p className="mt-4 flex-1 text-[15px] leading-8 text-[#59675f]">
                {description}
              </p>

              <p className="mt-5 text-sm font-semibold text-[#9b7a35]">
                {domain}
              </p>

              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-[14px] border border-[#008b43] px-5 py-3 font-extrabold text-[#008b43] transition hover:bg-[#008b43] hover:text-white"
              >
                ورود به سایت
                <ExternalLink size={18} />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#fffdf8] px-6 py-14 sm:px-10 lg:py-16">
        <div className="mx-auto max-w-5xl rounded-[28px] border border-[#eadfc9] bg-white px-7 py-10 text-center shadow-[0_18px_42px_rgba(70,82,74,0.07)] sm:px-12">
          <p className="text-[20px] font-extrabold text-[#b88a2f]">
            راهنمای استفاده
          </p>

          <p className="mx-auto mt-5 max-w-3xl text-lg leading-9 text-[#526159]">
            برای مشاهده محتوای هر پایگاه، روی دکمه «ورود به سایت» کلیک کنید.
            پیوندها در پنجره‌ای جدید باز می‌شوند تا صفحه فعلی سامانه در دسترس
            باقی بماند.
          </p>
        </div>
      </section>
    </main>
  );
}
