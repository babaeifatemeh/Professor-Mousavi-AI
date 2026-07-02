export default function Hero() {
  return (
    <section className="relative z-10 mx-auto mt-28 max-w-6xl text-center">
      <div className="mx-auto mb-10 flex items-center justify-center gap-4 text-green-500">
        <div className="h-px w-40 bg-green-300" />
        <div className="text-4xl">❈</div>
        <div className="h-px w-40 bg-green-300" />
      </div>

      <h2 className="mx-auto max-w-5xl text-5xl font-extrabold leading-[1.8] text-green-950">
        دستیار هوشمند مباحث درسی
        <br />
        استاد علامه سید علی موسوی (ره)
      </h2>

      <p className="mt-6 text-2xl text-gray-600">
        پاسخگویی مبتنی بر محتوای جزوات و متون درسی
      </p>
    </section>
  );
}