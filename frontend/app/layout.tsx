import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";

const vazir = Vazirmatn({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "پایگاه جامع درسی استاد علامه سید علی موسوی‌(ره)",
  description: "دستیار هوشمند مباحث درسی",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

return (
  <html lang="fa" dir="rtl">
  <body className={`${vazir.className} bg-[#eef8ef] text-[#063f25]`}>
    <div className="bg-[#eef8ef] px-4 py-5 sm:px-6 md:px-10 md:py-8">
      <Header />
    </div>

  {children}

  <div className="bg-[#eef8ef]">
    <Footer />
  </div>
</body>
  </html>
);
}