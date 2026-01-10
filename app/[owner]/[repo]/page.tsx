import Image from "next/image";
import type { Metadata } from "next";
import { fetchBrevozaConfig, parseCollectionsFromConfig, fetchFileAtPath } from "../../lib/brevozaConfig";
import NewItemForm from "./components/NewItemForm";
import ItemsList from "./components/ItemsList";

export async function generateMetadata({ params }: { params: Promise<{ owner: string; repo: string }> }): Promise<Metadata> {
  const { owner, repo } = await params;
  return {
    title: `${owner}/${repo} | Brevoza CMS`,
    description: `View and manage content for ${owner}/${repo} repository`,
  };
}

export default async function RepoPage({ params }: { params: Promise<{ owner: string; repo: string }> }) {
  const { owner, repo } = await params;
  const branch = "main";

  const { content, error, url } = await fetchBrevozaConfig(owner, repo, branch);

  // Find collections and fetch their config files (if any)
  const collections = parseCollectionsFromConfig(content ?? "");
  const collectionsResults = await Promise.all(
    collections.map(async (c) => {
      if (!c.config) return { name: c.name, error: "No config file specified for this collection." };
      const res = await fetchFileAtPath(owner, repo, branch, c.config);
      const items = res.content ? await (await import("../../lib/brevozaConfig")).fetchAllItemsForCollection(owner, repo, branch, c.name, res.content) : { error: "No collection config content" };
      return { name: c.name, configFile: c.config, ...res, items };
    })
  );

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 font-sans dark:bg-black py-12">
      <main className="w-full max-w-4xl rounded-md bg-white p-8 shadow-sm dark:bg-black">
        <header className="flex items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">{owner}/{repo}</h1>
          </div>
          <div className="flex gap-3">
            <a
              href="/"
              className="rounded-full border border-solid border-black/[.08] px-4 py-2 text-sm hover:bg-black/[.04] dark:border-white/[.145]"
            >
              Home
            </a>
            <a
              href={`/${owner}/${repo}/proposals`}
              className="rounded-full border border-solid border-black/[.08] px-4 py-2 text-sm hover:bg-black/[.04] dark:border-white/[.145]"
            >
              View Proposals
            </a>
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
              href={`https://github.com/${owner}/${repo}`}
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

          <p className="mt-4 text-xs text-zinc-500">Viewing: <code>{owner}/{repo}</code> on branch <code>{branch}</code></p>
        </section>

        {collectionsResults.length > 0 ? (
          <section className="mt-6">
            <h2 className="mb-3 text-lg font-medium">Collections</h2>
            <div className="flex flex-col gap-6">
              {collectionsResults.map((col) => (
                <div key={col.name} className="rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <h3 className="text-md font-medium">{col.name}</h3>
                  <div className="mt-2">
                    {col.error ? (
                      <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                        <strong>Error:</strong> {col.error}
                        { (col as any).url ? (
                          <div className="mt-2 text-xs text-zinc-600">Tried URL: <a className="underline" href={(col as any).url} target="_blank" rel="noreferrer">{(col as any).url}</a></div>
                        ) : null}
                      </div>
                    ) : (
                      <pre className="mt-2 max-h-[40vh] overflow-auto rounded-md border border-zinc-200 bg-zinc-100 p-3 text-sm leading-6 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
                        {(col as any).content}
                      </pre>
                    )}

                    {/* Items list for this collection */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium">Items</h4>

                      {(col as any).items?.error ? (
                        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 mt-2">
                          <strong>Error:</strong> {(col as any).items.error}
                        </div>
                      ) : (col as any).items?.items && (col as any).items.items.length > 0 ? (
                        <div className="mt-2">
                          <ItemsList 
                            items={(col as any).items.items} 
                            collectionName={col.name} 
                          />
                        </div>
                      ) : (
                        <div className="text-xs text-zinc-500 mt-2">No items found for this collection.</div>
                      )}
                    </div>

                    {/* NewItemForm component */}
                    {(col as any).content && (
                      <NewItemForm 
                        collectionConfig={(col as any).content} 
                        collectionName={col.name}
                        owner={owner}
                        repo={repo}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
