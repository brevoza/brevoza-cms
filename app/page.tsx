import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home | Brevoza CMS",
  description: "Welcome to Brevoza - Content Management System for GitHub repositories",
};

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="w-full max-w-2xl px-4">
        <h1 className="text-4xl font-bold text-black dark:text-white mb-12 text-center">Welcome to Brevoza</h1>
        
        <div className="flex flex-col gap-4">
          <a
            href="/brevoza/US-presidents"
            className="block rounded-lg border border-zinc-200 bg-white px-6 py-4 text-lg font-medium text-black hover:bg-zinc-50 hover:shadow-md transition-all dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
          >
            brevoza/US-presidents
          </a>
          
          <a
            href="/brevoza/church-of-jesus-christ-temples"
            className="block rounded-lg border border-zinc-200 bg-white px-6 py-4 text-lg font-medium text-black hover:bg-zinc-50 hover:shadow-md transition-all dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
          >
            brevoza/church-of-jesus-christ-temples
          </a>
          
          <a
            href="/brevoza/jonny-jackson-projects"
            className="block rounded-lg border border-zinc-200 bg-white px-6 py-4 text-lg font-medium text-black hover:bg-zinc-50 hover:shadow-md transition-all dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
          >
            brevoza/jonny-jackson-projects
          </a>
        </div>
      </main>
    </div>
  );
}
