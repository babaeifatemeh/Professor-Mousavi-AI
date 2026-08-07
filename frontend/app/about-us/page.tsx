"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

type IconProps = { className?: string };

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
    <div className="mx-auto my-4 flex w-40 items-center justify-center gap-3">
      <span className="h-px flex-1 bg-[#d8b76b]" />
      <span className="h-3 w-3 rotate-45 border border-[#b88a2f] bg-[#fffaf0]" />
      <span className="h-px flex-1 bg-[#d8b76b]" />
    </div>
  );
}

export interface Book {
  id: string;
  title: string;
  category: 'tafsir' | 'falsafi' | 'english' | 'salnameh';
  buyUrl: string;
}

export const BOOKS_DATA: Book[] = [
  { id: '1', title: 'نقطه الهدايه (جلد اول)', category: 'tafsir', buyUrl: 'https://www.ostad-mosavi.com/books/' },
  { id: '2', title: 'نقطه الهدايه (جلد دوم)', category: 'tafsir', buyUrl: 'https://www.ostad-mosavi.com/books/' },
  { id: '3', title: 'کتاب کوکب درى', category: 'tafsir', buyUrl: 'https://www.ostad-mosavi.com/books/' },
  { id: '4', title: 'کتاب سراج منیر', category: 'tafsir', buyUrl: 'https://www.ostad-mosavi.com/books/' },
  { id: '5', title: 'کتاب شهاب ثاقب', category: 'tafsir', buyUrl: 'https://www.ostad-mosavi.com/books/' },
  { id: '6', title: 'سیر نفس قدسی الهی (۱)', category: 'falsafi', buyUrl: 'https://www.ostad-mosavi.com/books/' },
  { id: '7', title: 'سیر نفس قدسی الهی (۲)', category: 'falsafi', buyUrl: 'https://www.ostad-mosavi.com/books/' },
  { id: '8', title: 'سیر نفس قدسی الهی (۳)', category: 'falsafi', buyUrl: 'https://www.ostad-mosavi.com/books/' },
  { id: '9', title: 'سیر نفس قدسی الهی (۴)', category: 'falsafi', buyUrl: 'https://www.ostad-mosavi.com/books/' },
  { id: '10', title: 'سیر نفس قدسی الهی (۵) - ماهیت روح', category: 'falsafi', buyUrl: 'https://www.ostad-mosavi.com/books/' },
  { id: '11', title: 'Kawkab Dorri _ Part 1', category: 'english', buyUrl: 'https://www.ostad-mosavi.com/books/' },
  { id: '12', title: 'Kawkab Dorri _ Part 2', category: 'english', buyUrl: 'https://www.ostad-mosavi.com/books/' },
  { id: '13', title: 'سالنامه قرآن و برهان (شماره سه)', category: 'salnameh', buyUrl: 'https://quranoburhan.ir/' },
  { id: '14', title: 'سالنامه قرآن و برهان (شماره چهار)', category: 'salnameh', buyUrl: 'https://quranoburhan.ir/' },
  { id: '15', title: 'سالنامه قرآن و برهان (شماره پنج)', category: 'salnameh', buyUrl: 'https://quranoburhan.ir/' },
  { id: '16', title: 'سالنامه قرآن و برهان (شماره شش)', category: 'salnameh', buyUrl: 'https://quranoburhan.ir/' },
  { id: '17', title: 'دوفصلنامه قرآن و برهان (شماره یک)', category: 'salnameh', buyUrl: 'https://quranoburhan.ir/' },
  { id: '18', title: 'دوفصلنامه قرآن و برهان (شماره دو)', category: 'salnameh', buyUrl: 'https://quranoburhan.ir/' },
];

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
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'همه آثار' },
    { id: 'tafsir', label: 'کتب تفسیری و قرآنی' },
    { id: 'falsafi', label: 'کتب فلسفی و حکمی' },
    { id: 'salnameh', label: 'نشریه و سالنامه قرآن و برهان' },
    { id: 'english', label: 'ترجمه‌ها (English)' },
  ];

  const filteredBooks = activeCategory === 'all' 
    ? BOOKS_DATA 
    : BOOKS_DATA.filter(b => b.category === activeCategory);

  return (
    <main dir="rtl" className="min-h-screen overflow-hidden bg-[#fbfaf7] text-[#26372f]">
      {/* بخش هیرو */}
      <section className="relative overflow-hidden border-b border-[#eadfca] bg-[#fffdf8]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_22%,rgba(216,183,107,0.14),transparent_31%),radial-gradient(circle_at_82%_58%,rgba(0,139,67,0.10),transparent_34%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 py-12 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-16 lg:py-16">
          
          {/* ستون متن */}
          <div className="order-2 text-center lg:order-1">
            <h1 className="text-2xl font-black leading-tight text-[#008b43] sm:text-4xl">
              مؤسسه فرهنگی قرآن و عترت حکمة صافیه
            </h1>

            <p className="mt-2 text-lg font-bold text-[#1a2e22] sm:text-xl">
              (مؤسس استاد علامه سید علی موسوی (ره))
            </p>

            <div className="mt-4 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#d7bb76] bg-[#fdfbf6] px-4 py-1.5 text-xs font-extrabold text-[#b88a2f] sm:text-sm">
                <CertificateIcon className="h-4 w-4 text-[#b88a2f]" />
                با مجوز رسمی از وزارت فرهنگ و ارشاد اسلامی
              </span>
            </div>

            <Ornament />

            <p className="mx-auto mt-4 max-w-2xl text-base font-bold leading-8 text-[#008b43] sm:text-lg sm:leading-9">
              تبیین شایسته دیدگاه‌ها، نظریات و شیوه تحقیق علمی و حکمی فیلسوف متأله استاد علامه سید علی موسوی (ره)
            </p>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#5b6861] sm:text-base sm:leading-8">
              این مؤسسه پس از سالیانی متمادی از تدریس استاد در مبانی علمی و فلسفی اسفار ملاصدرا و سخنرانی‌های تفسیری ذیل تفسیر صافی، توسط صحابه درسی استاد تاسیس شد تا گامی بلند در جهت انتقال معارف اصیل قرآن و عترت به نسل‌های آینده برداشته شود.
            </p>

            <div className="mt-8 flex justify-center">
              <Link
                href="/about-system"
                className="inline-flex items-center justify-center rounded-[14px] border border-[#d7bb76] bg-white px-8 py-3 text-base font-extrabold text-[#08743d] shadow-[0_6px_20px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:bg-[#faf8f2]"
              >
                سامانه پژوهشی هوشمند
              </Link>
            </div>
          </div>

          {/* ستون تصویر استاد */}
          <div className="order-1 lg:order-2">
            <div className="relative overflow-hidden rounded-[28px] border border-[#eadfca] bg-white p-4 shadow-[0_24px_70px_rgba(62,80,69,0.14)]">
              <div className="mb-2 text-right text-sm font-bold text-[#5b6861]">
                استاد علامه سید علی موسوی (ره)
              </div>
              <div className="relative h-[340px] w-full overflow-hidden rounded-[22px] sm:h-[400px]">
                {/* استفاده از img برای اطمینان از خوانده شدن فایل از public */}
                <img
                  src="/allameh-mousavi.jpg"
                  alt=""
                  className="h-full w-full object-cover object-top"
                />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* باقی بخش‌ها */}
      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-10 lg:px-16 lg:py-20">
        <div className="rounded-[30px] border border-[#eadfc9] bg-white p-8 shadow-[0_22px_54px_rgba(70,82,74,0.08)] sm:p-12">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="text-lg font-extrabold text-[#b88a2f]">دیدگاه خاص حضرت استاد</span>
              <h2 className="mt-2 text-2xl font-black text-[#08743d] sm:text-3xl">
                پیوند دانش فلسفی با حقایق قرآنی
              </h2>
              <p className="mt-5 text-[16px] leading-8 text-[#59675f]">
                اساس دروس استاد اگرچه بر مداری فلسفی و علمی است، اما جان بیان ایشان حکایت از درک عمیق مبانی آیات قرآن کریم و روایات ائمه معصومین (ع) دارد.
              </p>
            </div>
            <div className="rounded-[22px] border border-[#e2d5bd] bg-[#fffdf8] p-6 text-sm leading-8 text-[#4a5851]">
              <p className="font-bold text-[#08743d]">«توصیه تاکیدشده استاد:»</p>
              <blockquote className="mt-2 italic">
                «اصل فعالیت‌های شاگردان باید بر مبنای روحانیت، معنویت و تأیید حضرت امام زمان (عج) باشد...»
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* خط زمانی */}
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

      {/* آثار */}
      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
        <div className="text-center">
          <h2 className="text-3xl font-black text-[#b88a2f] sm:text-4xl">
            آثار و تألیفات استاد علامه سید علی موسوی (ره)
          </h2>
          <Ornament />
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                activeCategory === cat.id
                  ? 'bg-[#008b43] text-white shadow-md'
                  : 'bg-white border border-[#eadfc9] text-[#26372f] hover:bg-[#f9fbf7]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className="bg-white rounded-[22px] border border-[#eadfc9] p-6 shadow-[0_10px_30px_rgba(70,82,74,0.05)] flex flex-col justify-between items-center text-center"
            >
              <div>
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#fdfbf6] border border-[#d7bb76] flex items-center justify-center text-[#08743d]">
                  <BooksIcon className="h-7 w-7" />
                </div>
                <h3 className="text-base font-black text-[#26372f] mb-2 leading-snug">
                  {book.title}
                </h3>
              </div>

              <a
                href={book.buyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 w-full py-2.5 px-4 border border-[#d7bb76] text-[#08743d] rounded-xl font-bold text-sm hover:bg-[#fdfbf6] transition-colors flex items-center justify-center gap-2"
              >
                <span>تهیه اثر</span>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* پیام پایانی */}
      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-10 lg:px-16">
        <div className="overflow-hidden rounded-[28px] bg-[#008b43] px-7 py-12 text-center shadow-[0_22px_55px_rgba(0,139,67,0.22)] sm:px-12">
          <p className="text-[18px] font-extrabold text-[#f1d792]">توفیقات ربانی و عنایات حضرت ولی‌عصر (عج)</p>
          <blockquote className="mx-auto mt-4 max-w-4xl text-lg font-semibold leading-[2] text-white sm:text-xl">
            امیدواریم در این مأمن علمی و قرآنی بتوانیم ذره‌ای از حق فراوان دروس و مجاهدت‌های علمی حضرت استاد علامه سید علی موسوی (ره) را به شایستگی ادا نماییم.
          </blockquote>
        </div>
      </section>
    </main>
  );
}