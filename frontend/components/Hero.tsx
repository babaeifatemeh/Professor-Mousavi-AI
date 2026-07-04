export default function Hero() {
  return (
    <section className="relative z-10 mx-auto mt-8 max-w-5xl px-2 text-center sm:px-4 md:mt-14">
      <div className="mx-auto mb-5 flex items-center justify-center gap-3 text-green-500 md:mb-6">
        <div className="h-px w-14 bg-green-300 md:w-32" />
        <div className="text-xl md:text-3xl">❈</div>
        <div className="h-px w-14 bg-green-300 md:w-32" />
      </div>

      <h2 className="mx-auto max-w-4xl text-2xl font-extrabold leading-[2.4rem] text-green-950 sm:text-3xl md:text-5xl md:leading-relaxed">
        دستیار هوشمند مباحث درسی
        <br />
        استاد علامه سید علی موسوی‌(ره)
      </h2>

      <p className="mt-4 text-sm leading-8 text-gray-600 sm:text-base md:text-xl">
        پاسخگویی مبتنی بر محتوای کتابها، جزوات و متون درسی معظم‌له
      </p>
    </section>
  );
}
