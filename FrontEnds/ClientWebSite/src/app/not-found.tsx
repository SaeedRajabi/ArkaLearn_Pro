import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-background px-4 py-10 text-center font-headline">
      <section className="mx-auto flex w-full max-w-2xl flex-col items-center">
        <img
          src="/images/elements/error404-01.svg"
          alt="404 error"
          className="h-auto w-full max-w-[360px] sm:max-w-[440px] md:max-w-[520px]"
        />

        <h1 className="mt-2 text-6xl font-black leading-none text-rose-600 sm:text-7xl md:text-8xl">
          ۴۰۴
        </h1>
        <h2 className="mt-5 text-xl font-black text-foreground sm:text-2xl">
          اوه نه، مشکلی پیش آمد!
        </h2>
        <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">
          یا مشکلی پیش آمده یا این صفحه دیگر وجود ندارد.
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          بازگشت به صفحه اصلی
        </Link>
      </section>
    </main>
  );
}
