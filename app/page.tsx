import Image from "next/image";
import { fetchBrevozaConfig } from "./lib/brevozaConfig";

export default async function Home() {
  const { content, error, url } = await fetchBrevozaConfig();

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 font-sans dark:bg-black py-12">
      <main className="w-full max-w-4xl rounded-md bg-white p-8 shadow-sm dark:bg-black">
        <header className="flex items-center gap-6">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={84}
            height={18}
            priority
          />
          <div>
            <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Brevoza CMS</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Displays the repository's <code>brevoza.config.yml</code></p>
          </div>
        </header>

        <section className="mt-8">
          <h2 className="mb-2 text-lg font-medium">brevoza.config.yml</h2>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <strong>Error:</strong> {error}
              {url ? (
                <div className="mt-2 text-xs text-zinc-600">Tried URL: <a className="underline" href={url} target="_blank" rel="noreferrer">{url}</a></div>
              ) : null}
            </div>
          ) : (
            <pre className="mt-4 max-h-[60vh] overflow-auto rounded-md border border-zinc-200 bg-zinc-100 p-4 text-sm leading-6 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
              {content}
            </pre>
          )}

          <div className="mt-4 flex gap-3">
            <a
              href={`https://github.com/${process.env.REPO_OWNER}/${process.env.REPO_NAME}`}
              className="rounded-full border border-solid border-black/[.08] px-4 py-2 text-sm hover:bg-black/[.04] dark:border-white/[.145]"
              target="_blank"
              rel="noreferrer"
            >
              Open repo on GitHub
            </a>

            {url ? (
              <a className="rounded-full border border-solid border-black/[.08] px-4 py-2 text-sm hover:bg-black/[.04] dark:border-white/[.145]" href={url} target="_blank" rel="noreferrer">
                Open raw file
              </a>
            ) : null}
          </div>

          <p className="mt-4 text-xs text-zinc-500">Make sure <code>REPO_OWNER</code> and <code>REPO_NAME</code> are set in your environment (for local dev, add them to <code>.env</code>).</p>
        </section>
      </main>
    </div>
  );
}
