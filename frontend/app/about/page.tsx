import Image from "next/image";
import Link from "next/link";

type IconProps = { className?: string };

function QuranIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <path d="M12 18c0-3.3 2.7-6 6-6h14v38H18c-3.3 0-6-2.7-6-6V18Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round"/>
      <path d="M52 18c0-3.3-2.7-6-6-6H32v38h14c3.3 0 6-2.7 6-6V18Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round"/>
      <path d="M32 12v38M20 22h8M20 30h8M36 22h8M36 30h8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
      <path d="M12 44c0 3.3 2.7 6 6 6h14v4H18c-5.5 0-10-4.5-10-10V18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M52 44c0 3.3-2.7 6-6 6H32v4h14c5.5 0 10-4.5 10-10V18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
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

function WisdomIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <path d="M32 10 14 20l18 10 18-10L32 10Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
      <path d="M18 24.5V40c0 6 6.3 11 14 11s14-5 14-11V24.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
      <path d="M32 30v21" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
    </svg>
  );
}

function CertificateIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <rect x="12" y="10" width="40" height="44" rx="4" stroke="currentColor" strokeWidth="2.4"/>
      <path d="M20 20h24M20 28h16M20 36h20" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
      <circle cx="40" cy="42" r="5" stroke="currentColor" strokeWidth="2.4"/>
    </svg>
  );
}

function HistoryIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="20" stroke="currentColor" strokeWidth="2.4"/>
      <path d="M32 18v15l10 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
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

const historyMilestones = [
  {
    date: "۳۱ تیر ۱۳۹۲",
    title: "تأسیس و آغاز فعالیت رسمی",
    text: "شروع فعالیت با اخذ مجوز آموزش عمومی و امور فرهنگی از وزارت فرهنگ و ارشاد اسلامی.",
  },
  {
    date: "۱ شهریور ۱۳۹۳",
    title: "ارتقا به آموزش تخصصی قرآن",
    text: "تمدید مجوز و گسترش دامنه فعالیت‌ها به حوزه آموزش‌های تخصصی قرآن کریم.",
  },
  {
    date: "۱۵ خرداد ۱۳۹۴",
    title: "تأسیس انتشارات استاد موسوی",
    text: "الحاق موضوع نشر کتاب به فعالیت‌های مؤسسه جهت چاپ و پیاده‌سازی آثار استاد.",
  },
];

const publishedBooks = [
  {
    title: "شهابٌ ثاقب",
    subtitle: "شرح آیاتی از سوره مبارکه اسراء",
    desc: "مجموعه سخنرانی‌های رمضان ۱۳۷۵ به انضمام تحقیق در مکتب مشاء و سیره حضرت علی (ع).",
  },
  {
    title: "سراجٌ منیر",
    subtitle: "شرح آیاتی از سوره مبارکه نحل",
    desc: "مجموعه سخنرانی‌های رمضان ۱۳۷۷ به انضمام عظمت رسول‌الله (ص).",
  },
  {
    title: "کوکب درّی",
    subtitle: "شرح سوره مبارکه انفال",
    desc: "مجموعه سخنرانی‌های رمضان ۱۳۷۸ به ضمیمه عظمت عصمت‌الکبری فاطمه زهرا (س).",
  },
  {
    title: "نقطة الهدايه",
    subtitle: "شرح آیاتی از سوره مبارکه هود",
    desc: "مجموعه سخنرانی‌های رمضان ۱۳۷۹ به انضمام سیر علمی فیثاغورس و بقراط.",
  },
  {
    title: "نفسٌ قدسیٌ الهیٌ (۴ جلد)",
    subtitle: "تدریس جلد هشتم اسفار ملاصدرا",
    desc: "مباحث سیر نفس از حکمت متعالیه ملاصدرا که به چاپ عمومی رسیده است.",
  },
];

const activeCourses = [
  "مقدمات تفسیر (آموزش اصطلاحات و آشنایی با مفسران)",
  "مقدمات فلسفه (بررسی مکاتب مادی و الهی، مشاء، اشراق و حکمت متعالیه)",
  "آموزش زبان عربی با محوریت قرآن کریم",
  "شرح و تحقیق تخصصی پیرامون سوره مبارکه انعام",
  "بررسی سیره و مکتب حضرت حجت (عج)",
  "مباحث تخصصی اسفار اربعه (علت و معلول، حرکت و سکون، سیر نفس)",
  "تاریخ تفسیر و حوزه‌های نامدار شیعه (مدینه، کوفه، بغداد، نجف و قم)",
  "تحقیق در زندگی علمی بزرگان تشیع و توقیعات شریف",
];

export default function AboutHikmatSafiyyahPage() {
  return (
    <main dir="rtl" className="min-h-screen overflow-hidden bg-[#fbfaf7] text-[#26372f]">
      {/* بخش هیرو / معرفی اصلی مؤسسه */}
      <section className="relative overflow-hidden border-b border-[#eadfca] bg-[#fffdf8]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_22%,rgba(216,183,107,0.14),transparent_31%),radial-gradient(circle_at_82%_58%,rgba(0,139,67,0.10),transparent_34%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-14 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-16 lg:py-20">
          <div className="order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d7bb76] bg-[#fdfbf6] px-4 py-1.5 text-sm font-extrabold text-[#b88a2f]">
              <CertificateIcon className="h-4 w-4 text-[#b88a2f]" />
              با مجوز رسمی از وزارت فرهنگ و ارشاد اسلامی
            </div>
            
            <h1 className="mt-4 text-3xl font-black leading-[1.45] text-[#008b43] sm:text-5xl">
              مؤسسه فرهنگی قرآن و عترت حکمة صافیه
            </h1>
            
            <div className="mt-5 flex w-44 items-center gap-3">
              <span className="h-px flex-1 bg-[#d8b76b]" />
              <span className="h-3 w-3 rotate-45 border border-[#b88a2f] bg-[#fffaf0]" />
              <span className="h-px flex-1 bg-[#d8b76b]" />
            </div>

            <p className="mt-7 max-w-2xl text-lg font-bold leading-9 text-[#17693f] sm:text-xl sm:leading-10">
              تبیین شایسته دیدگاه‌ها، نظریات و شیوه تحقیق علمی و حکمی فیلسوف متأله استاد علامه سید علی موسوی (ره)
            </p>
            
            <p className="mt-5 max-w-2xl text-[16px] leading-8 text-[#5b6861] sm:text-[17px] sm:leading-9">
              این مؤسسه پس از سالیانی متمادی از تدریس استاد در مبانی علمی و فلسفی اسفار ملاصدرا و سخنرانی‌های تفسیری ذیل تفسیر صافی، توسط صحابه درسی استاد تاسیس شد تا گامی بلند در جهت انتقال معارف اصیل قرآن و عترت به نسل‌های آینده برداشته شود.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/about-system"
                className="inline-flex items-center justify-center rounded-[14px] bg-[#008b43] px-8 py-3.5 text-base font-extrabold text-white shadow-[0_12px_28px_rgba(0,139,67,0.22)] transition hover:-translate-y-0.5 hover:bg-[#00783a]"
              >
                سامانه پژوهشی هوشمند
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-[14px] border border-[#d7bb76] bg-white px-8 py-3.5 text-base font-extrabold text-[#08743d] shadow-[0_6px_20px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:bg-[#faf8f2]"
              >
                ورود به سامانه گفت‌وگو
              </Link>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative overflow-hidden rounded-[28px] border border-[#eadfca] bg-white p-3 shadow-[0_24px_70px_rgba(62,80,69,0.14)]">
              <div className="relative h-[360px] w-full overflow-hidden rounded-[22px] sm:h-[430px]">
                <Image
                  src="/allameh-mousavi.jpg"
                  alt="استاد علامه سید علی موسوی (ره)"
                  fill
                  priority
                  className="object-cover object-top"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* رویکرد و دیدگاه اصلی */}
      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-10 lg:px-16 lg:py-20">
        <div className="rounded-[30px] border border-[#eadfc9] bg-white p-8 shadow-[0_22px_54px_rgba(70,82,74,0.08)] sm:p-12">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="text-lg font-extrabold text-[#b88a2f]">دیدگاه خاص حضرت استاد</span>
              <h2 className="mt-2 text-2xl font-black text-[#08743d] sm:text-3xl">
                پیوند دانش فلسفی با حقایق قرآنی
              </h2>
              <p className="mt-5 text-[16px] leading-8 text-[#59675f]">
                اساس دروس استاد اگرچه بر مداری فلسفی و علمی است، اما جان بیان ایشان حکایت از درک عمیق مبانی آیات قرآن کریم و روایات ائمه معصومین (ع) دارد. نتیجه اصلی این رویکرد، استحکام پایه‌های مذهبی، اخلاقی و عرفانی شاگردان بر مبنای متقن علمی است.
              </p>
            </div>
            <div className="rounded-[22px] border border-[#e2d5bd] bg-[#fffdf8] p-6 text-sm leading-8 text-[#4a5851]">
              <p className="font-bold text-[#08743d]">«توصیه تاکیدشده استاد:»</p>
              <blockquote className="mt-2 italic">
                «اصل فعالیت‌های شاگردان باید بر مبنای روحانیت، معنویت و تأیید حضرت امام زمان (عج) باشد، نه صرفاً پوسته و دیواره کار از جنس تعالیم قرآنی باشد. باید درس‌ها و کلاس‌های قرآنی به قدری از نظر علمی قوی کار کنند تا مراکز علمی و دانشگاهی در برابر این حوزه‌های درسی زانو بزنند.»
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* خط زمانی تاریخچه تأسیس */}
      <section className="bg-[#fffdf8] px-6 py-16 sm:px-10 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-black text-[#b88a2f] sm:text-4xl">
              مسیر رشد و روند قانونی مؤسسه
            </h2>
            <Ornament />
          </div>

          <div className="mt-14 grid gap-7 md:grid-cols-3">
            {historyMilestones.map((item, index) => (
              <div
                key={index}
                className="relative rounded-[26px] border border-[#eadfc9] bg-white p-8 text-center shadow-[0_18px_42px_rgba(70,82,74,0.06)]"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#d7bb76] bg-[#f9fbf7] text-[#08743d]">
                  <HistoryIcon className="h-7 w-7" />
                </div>
                <span className="mt-4 inline-block rounded-full bg-[#eaf5ee] px-4 py-1 text-sm font-black text-[#08743d]">
                  {item.date}
                </span>
                <h3 className="mt-4 text-xl font-black text-[#26372f]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#59675f]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* انتشارات و آثار چاپ شده */}
      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
        <div className="text-center">
          <h2 className="text-3xl font-black text-[#b88a2f] sm:text-4xl">
            انتشارات استاد موسوی و آثار منتشرشده
          </h2>
          <p className="mt-3 text-base text-[#59675f]">
            از میان بیش از ۲۵۰ اثر حاصل تدریس و سخنرانی‌های استاد، آثار زیر به چاپ رسیده‌اند:
          </p>
          <Ornament />
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {publishedBooks.map((book, idx) => (
            <div
              key={idx}
              className="rounded-[24px] border border-[#eadfc9] bg-white p-7 shadow-[0_14px_35px_rgba(70,82,74,0.06)] transition hover:-translate-y-1"
            >
              <div className="flex items-center gap-3 text-[#08743d]">
                <BooksIcon className="h-8 w-8 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-black">{book.title}</h3>
                  <p className="text-xs font-bold text-[#b88a2f]">{book.subtitle}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-[#5a6860]">{book.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* دوره‌ها و فعالیت‌های علمی آموزشی */}
      <section className="bg-[#fffdf8] border-t border-[#eadfca] px-6 py-16 sm:px-10 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-black text-[#b88a2f] sm:text-4xl">
              دوره‌ها و فعالیت‌های آموزشی برگزارشده
            </h2>
            <Ornament />
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {activeCourses.map((course, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-[18px] border border-[#eadfc9] bg-white p-5 shadow-[0_6px_20px_rgba(0,0,0,0.03)]"
              >
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#08743d] text-xs font-extrabold text-white">
                  {idx + 1}
                </span>
                <p className="text-sm font-bold leading-6 text-[#26372f]">{course}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* پیام پایانی و صلوات */}
      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-10 lg:px-16">
        <div className="overflow-hidden rounded-[28px] bg-[#008b43] px-7 py-12 text-center shadow-[0_22px_55px_rgba(0,139,67,0.22)] sm:px-12">
          <p className="text-[18px] font-extrabold text-[#f1d792]">توفیقات ربانی و عنایات حضرت ولی‌عصر (عج)</p>
          <blockquote className="mx-auto mt-4 max-w-4xl text-lg font-semibold leading-[2] text-white sm:text-xl">
            امیدواریم در این مأمن علمی و قرآنی بتوانیم ذره‌ای از حق فراوان دروس و مجاهدت‌های علمی حضرت استاد علامه سید علی موسوی (ره) را به شایستگی ادا نماییم.
          </blockquote>
          <div className="mx-auto mt-6 flex w-28 items-center gap-3">
            <span className="h-px flex-1 bg-[#f1d792]" />
            <span className="h-3 w-3 rotate-45 border border-[#f1d792]" />
            <span className="h-px flex-1 bg-[#f1d792]" />
          </div>
        </div>
      </section>
    </main>
  );
}