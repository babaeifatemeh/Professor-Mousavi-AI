import Footer from "@/components/Footer";

export default function SiteRulesPage() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#eef8ef] text-[#063f25]"
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

    
        <section className="mx-auto mt-10 max-w-5xl rounded-3xl border border-green-100 bg-white p-8 shadow-xl">

          <h1 className="mb-8 text-center text-4xl font-black text-green-900">
            قوانین استفاده از سامانه
          </h1>

          <div className="space-y-8 leading-9 text-gray-700">

            <section>
              <h2 className="mb-3 text-2xl font-bold text-green-800">
                ۱. هدف سامانه
              </h2>

              <p>
                این سامانه با هدف تسهیل دسترسی به منابع آموزشی و پژوهشی استاد
                علامه سید علی موسوی (ره) طراحی شده است و صرفاً در راستای
                آموزش، پژوهش و گسترش معارف اسلامی مورد استفاده قرار می‌گیرد.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-bold text-green-800">
                ۲. مسئولیت استفاده
              </h2>

              <p>
                کاربران متعهد می‌شوند از سامانه در چارچوب قوانین جمهوری اسلامی
                ایران و اهداف علمی و فرهنگی آن استفاده نمایند.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-bold text-green-800">
                ۳. حقوق مالکیت
              </h2>

              <p>
                تمامی منابع، اسناد، متون، تصاویر و محتوای موجود در سامانه متعلق
                به مؤسسه فرهنگی قرآن و عترت حکمةٌ صافیه و استاد علامه سید علی
                موسوی (ره) بوده و هرگونه استفاده خارج از چارچوب مجاز، منوط به
                کسب اجازه کتبی خواهد بود.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-bold text-green-800">
                ۴. پاسخ‌های هوش مصنوعی
              </h2>

              <p>
                پاسخ‌های ارائه‌شده توسط سامانه بر اساس منابع موجود تولید می‌شوند
                و صرفاً جنبه راهنمای پژوهشی دارند. در موارد تخصصی، مراجعه به متن
                اصلی منابع توصیه می‌شود.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-bold text-green-800">
                ۵. حریم خصوصی
              </h2>

              <p>
                اطلاعات کاربران صرفاً جهت ارائه خدمات سامانه استفاده شده و در
                اختیار اشخاص یا سازمان‌های دیگر قرار نخواهد گرفت.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-bold text-green-800">
                ۶. تغییر قوانین
              </h2>

              <p>
                مؤسسه فرهنگی قرآن و عترت حکمةٌ صافیه این حق را دارد که در صورت
                نیاز، قوانین سامانه را به‌روزرسانی نماید.
              </p>
            </section>

          </div>

        </section>

        <Footer />

      </div>
    </main>
  );
}