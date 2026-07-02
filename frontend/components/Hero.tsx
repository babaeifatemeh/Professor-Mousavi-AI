export default function Hero() {
  return (
    <section className="relative z-10 mx-auto mt-10 md:mt-16 max-w-5xl px-4 text-center">
      <div className="mx-auto mb-6 flex items-center justify-center gap-3 text-green-500">
        <div className="h-px w-16 md:w-32 bg-green-300" />
        <div className="text-xl md:text-3xl">❈</div>
        <div className="h-px w-16 md:w-32 bg-green-300" />
      </div>

      <h2 className="mx-auto max-w-4xl text-3xl md:text-5xl font-extrabold leading-relaxed text-green-950">
        دستیار هوشمند مباحث درسی
        <br />
        استاد علامه سید علی موسوی (ره)
      </h2>

      <p className="mt-4 text-base md:text-xl text-gray-600">
        پاسخگویی مبتنی بر محتوای جزوات و متون درسی
      </p>
    </section>
  );
}