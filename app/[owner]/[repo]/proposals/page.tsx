import type { Metadata } from "next";
import ProposalsList from "./ProposalsList";

export async function generateMetadata({ params }: { params: Promise<{ owner: string; repo: string }> }): Promise<Metadata> {
  const { owner, repo } = await params;
  return {
    title: `Proposals - ${owner}/${repo} | Brevoza CMS`,
    description: `View and manage proposals for ${owner}/${repo} repository`,
  };
}

export default async function ProposalsPage({ params }: { params: Promise<{ owner: string; repo: string }> }) {
  const { owner, repo } = await params;

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 font-sans dark:bg-black py-12">
      <main className="w-full max-w-4xl rounded-md bg-white p-8 shadow-sm dark:bg-black">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Proposals</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <a href={`/${owner}/${repo}`} className="underline hover:text-zinc-900 dark:hover:text-zinc-200">
                {owner}/{repo}
              </a>
            </p>
          </div>
          <a
            href={`/${owner}/${repo}`}
            className="rounded-full border border-solid border-black/[.08] px-4 py-2 text-sm hover:bg-black/[.04] dark:border-white/[.145]"
          >
            Back to Repository
          </a>
        </header>

        <ProposalsList owner={owner} repo={repo} />
      </main>
    </div>
  );
}
