import Image from "next/image";
import Link from "next/link";

type IconProps = { className?: string };

function AIIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <path d="M26 12c-5.5 0-10 4.5-10 10 0 1.5.3 2.9.9 4.1A10.5 10.5 0 0 0 19 46c1.8 0 3.5-.5 5-1.3A9.2 9.2 0 0 0 32 50V14a8.9 8.9 0 0 0-6-2Z" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M38 12c5.5 0 10 4.5 10 10 0 1.5-.3 2.9-.9 4.1A10.5 10.5 0 0 1 45 46c-1.8 0-3.5-.5-5-1.3A9.2 9.2 0 0 1 32 50V14a8.9 8.9 0 0 1 6-2Z" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23 22c2.5 0 4.5 1.2 5.5 3M41 22c-2.5 0-4.5 1.2-5.5 3M21 34c3.2-.9 6 .2 7.5 2.7M43 34c-3.2-.9-6 .2-7.5 2.7M24 43c2-2.1 4.5-3 8-3M40 43c-2-2.1-4.5-3-8-3" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
      <path d="M49 18h5M49 26h7M49 34h5M10 18h5M8 26h7M10 34h5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
      <circle cx="56" cy="18" r="2.2" fill="currentColor"/><circle cx="58" cy="26" r="2.2" fill="currentColor"/><circle cx="56" cy="34" r="2.2" fill="currentColor"/>
      <circle cx="8" cy="18" r="2.2" fill="currentColor"/><circle cx="6" cy="26" r="2.2" fill="currentColor"/><circle cx="8" cy="34" r="2.2" fill="currentColor"/>
    </svg>
  );
}

function BooksIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <rect x="16" y="11" width="34" height="11" rx="3" stroke="currentColor" strokeWidth="2.4"/>
      <rect x="12" y="27" width="38" height="11" rx="3" stroke="currentColor" strokeWidth="2.4"/>
      <rect x="16" y="43" width="34" height="10" rx="3" stroke="currentColor" strokeWidth="2.4"/>
      <path d="M22 16.5h21M18 32.5h25M22 48h21" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
    </svg>
  );
}

function ShieldIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <path d="M32 8 50 15v14c0 11.8-7.6 22-18 26.5C21.6 51 14 40.8 14 29V15l18-7Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
      <path d="m23.5 32 5 5 12-13" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function UserIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <circle cx="32" cy="22" r="10" stroke="currentColor" strokeWidth="2.4"/>
      <path d="M14 53c2.7-9.8 8.7-15 18-15s15.3 5.2 18 15" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
    </svg>
  );
}

function SearchIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <circle cx="28" cy="28" r="15" stroke="currentColor" strokeWidth="2.5"/>
      <path d="m39 39 12 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

function DocumentIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <path d="M18 9h21l9 9v37H18V9Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round"/>
      <path d="M39 9v11h9M25 30h16M25 38h16M25 46h10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
      <path d="m39 45 3 3 6-7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function Ornament() {
  return (
    <div className="mx-auto mt-5 flex w-40 items-center justify-center gap-3">
      <span className="h-px flex-1 bg-[#d8b76b]" />
      <span className="h-3 w-3 rotate-45 border border-[#b88a2f] bg-[#fffaf0]" />
      <span className="h-px flex-1 bg-[#d8b76b]" />
    </div>
  );
}

const features = [
  {
    title: "هوش مصنوعی پیشرفته",
    text: "تحلیل پرسش‌ها و بازیابی دقیق مطالب با استفاده از مدل‌های زبانی و بانک اطلاعات اختصاصی.",
    Icon: AIIcon,
  },
  {
    title: "منابع اصیل و معتبر",
    text: "پاسخ‌ها تنها بر اساس آثار، درس‌گفتارها و اسناد تأییدشده مؤسسه استخراج می‌شوند.",
    Icon: BooksIcon,
  },
  {
    title: "پاسخ مستند و قابل اعتماد",
    text: "هر پاسخ همراه با معرفی منابع استفاده‌شده ارائه می‌شود تا امکان بررسی دقیق وجود داشته باشد.",
    Icon: ShieldIcon,
  },
];

const steps = [
  {
    title: "پرسش شما",
    text: "سؤال خود را با زبان طبیعی در سامانه مطرح می‌کنید.",
    Icon: UserIcon,
  },
  {
    title: "جست‌وجوی منابع",
    text: "سامانه در میان آثار استاد، بخش‌های مرتبط را پیدا می‌کند.",
    Icon: SearchIcon,
  },
  {
    title: "تحلیل و پردازش",
    text: "هوش مصنوعی اطلاعات مرتبط را تحلیل و پاسخ را تنظیم می‌کند.",
    Icon: AIIcon,
  },
  {
    title: "پاسخ نهایی",
    text: "پاسخ دقیق و مستند همراه با منابع در اختیار شما قرار می‌گیرد.",
    Icon: DocumentIcon,
  },
];

export default function AboutSystemPage() {
  return (
    <main dir="rtl" className="min-h-screen overflow-hidden bg-[#fbfaf7] text-[#26372f]">
      <section className="relative overflow-hidden border-b border-[#eadfca] bg-[#fffdf8]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_22%,rgba(216,183,107,0.14),transparent_31%),radial-gradient(circle_at_82%_58%,rgba(0,139,67,0.10),transparent_34%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-14 sm:px-10 lg:grid-cols-[1.04fr_0.96fr] lg:px-16 lg:py-20">
          <div className="order-2 lg:order-1">
            <p className="text-[20px] font-extrabold text-[#b88a2f]">
              سامانه پژوهشی هوشمند
            </p>
            <h1 className="mt-3 text-5xl font-black leading-[1.45] text-[#008b43] sm:text-6xl">
              درباره سامانه
            </h1>
            <div className="mt-5 flex w-44 items-center gap-3">
              <span className="h-px flex-1 bg-[#d8b76b]" />
              <span className="h-3 w-3 rotate-45 border border-[#b88a2f] bg-[#fffaf0]" />
              <span className="h-px flex-1 bg-[#d8b76b]" />
            </div>

            <p className="mt-7 max-w-2xl text-xl font-bold leading-10 text-[#17693f]">
              دسترسی هوشمند به آثار و اندیشه‌های استاد علامه سید علی موسوی (ره)
            </p>
            <p className="mt-5 max-w-2xl text-[17px] leading-9 text-[#5b6861]">
              این سامانه با بهره‌گیری از هوش مصنوعی و بانک اطلاعات اختصاصی، پرسش‌های
              کاربران را بررسی می‌کند و پاسخ‌هایی مرتبط، منظم و مستند بر پایه
              منابع موجود ارائه می‌دهد.
            </p>

            <Link
              href="/"
              className="mt-9 inline-flex items-center justify-center rounded-[14px] bg-[#008b43] px-9 py-4 text-base font-extrabold text-white shadow-[0_12px_28px_rgba(0,139,67,0.22)] transition hover:-translate-y-0.5 hover:bg-[#00783a]"
            >
              شروع گفت‌وگو
            </Link>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative overflow-hidden rounded-[28px] border border-[#eadfca] bg-white shadow-[0_24px_70px_rgba(62,80,69,0.14)]">
              <Image
                src="/about-system-hero.png"
                alt="کتاب‌ها و فضای پژوهشی"
                width={900}
                height={730}
                priority
                className="h-[360px] w-full object-cover sm:h-[430px]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
        <div className="text-center">
          <h2 className="text-3xl font-black text-[#b88a2f] sm:text-4xl">
            چرا این سامانه؟
          </h2>
          <Ornament />
        </div>

        <div className="mt-12 grid gap-7 md:grid-cols-3">
          {features.map(({ title, text, Icon }) => (
            <article
              key={title}
              className="group rounded-[26px] border border-[#eadfc9] bg-white px-8 py-9 text-center shadow-[0_18px_42px_rgba(70,82,74,0.08)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_56px_rgba(70,82,74,0.13)]"
            >
              <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-[#d7bb76] bg-[#f9fbf7]">
                <div className="absolute inset-2 rounded-full bg-[#eaf5ee]" />
                <Icon className="relative h-14 w-14 text-[#08743d]" />
              </div>

              <h3 className="mt-7 text-[22px] font-black text-[#08743d]">
                {title}
              </h3>
              <p className="mt-4 text-[15px] leading-8 text-[#59675f]">{text}</p>

              <div className="mx-auto mt-7 flex w-24 items-center justify-center gap-2">
                <span className="h-px flex-1 bg-[#dfc27e]" />
                <span className="h-2.5 w-2.5 rotate-45 border border-[#bd9138] bg-white" />
                <span className="h-px flex-1 bg-[#dfc27e]" />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#fffdf8] px-6 py-16 sm:px-10 lg:py-24">
        <div className="mx-auto max-w-7xl rounded-[30px] border border-[#eadfc9] bg-white px-6 py-12 shadow-[0_22px_54px_rgba(70,82,74,0.08)] sm:px-10">
          <div className="text-center">
            <h2 className="text-3xl font-black text-[#b88a2f] sm:text-4xl">
              سامانه چگونه کار می‌کند؟
            </h2>
            <Ornament />
          </div>

          <div className="relative mt-14">
            <div className="absolute left-[9%] right-[9%] top-12 hidden h-px bg-[#d8b76b] md:block" />

            <div className="relative grid gap-10 md:grid-cols-4 md:gap-6">
              {steps.map(({ title, text, Icon }, index) => (
                <div key={title} className="relative text-center">
                  <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-[#d7bb76] bg-[#fffdf8] shadow-[0_10px_28px_rgba(69,82,73,0.08)]">
                    <Icon className="h-14 w-14 text-[#08743d]" />
                  </div>

                  <div className="mx-auto -mt-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#08743d] text-sm font-extrabold text-white ring-4 ring-white">
                    {index + 1}
                  </div>

                  <h3 className="mt-4 text-[19px] font-black text-[#08743d]">
                    {title}
                  </h3>
                  <p className="mx-auto mt-3 max-w-[220px] text-sm leading-7 text-[#5b6861]">
                    {text}
                  </p>

                  {index < steps.length - 1 && (
                    <span className="absolute -left-3 top-10 hidden h-3 w-3 rotate-45 bg-[#b88a2f] md:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
        <div className="overflow-hidden rounded-[28px] bg-[#008b43] px-7 py-12 text-center shadow-[0_22px_55px_rgba(0,139,67,0.22)] sm:px-12">
          <p className="text-[20px] font-extrabold text-[#f1d792]">اصل راهنما</p>
          <blockquote className="mx-auto mt-5 max-w-4xl text-2xl font-semibold leading-[2] text-white">
            این سامانه برای تسهیل پژوهش و دسترسی به منابع طراحی شده است و پاسخ
            آن باید در کنار مطالعه متن اصلی آثار مورد استفاده قرار گیرد.
          </blockquote>
          <div className="mx-auto mt-7 flex w-28 items-center gap-3">
            <span className="h-px flex-1 bg-[#f1d792]" />
            <span className="h-3 w-3 rotate-45 border border-[#f1d792]" />
            <span className="h-px flex-1 bg-[#f1d792]" />
          </div>
        </div>
      </section>
    </main>
  );
}
