import type { Metadata } from "next";
import { fetchBrevozaConfig, parseCollectionsFromConfig, fetchAllItemsForCollection } from "../../../lib/brevozaConfig";
import ApiExample from "./ApiExample";

export async function generateMetadata({ params }: { params: Promise<{ owner: string; repo: string }> }): Promise<Metadata> {
  const { owner, repo } = await params;
  return {
    title: `API Docs - ${owner}/${repo} | Brevoza CMS`,
    description: `API documentation for ${owner}/${repo} repository`,
  };
}

export default async function ApiDocsPage({ params }: { params: Promise<{ owner: string; repo: string }> }) {
  const { owner, repo } = await params;
  const branch = "main";

  // Fetch collections and get real example data
  const { content } = await fetchBrevozaConfig(owner, repo, branch);
  const collections = parseCollectionsFromConfig(content ?? "");
  const exampleCollection = collections[0]?.name || "collection-name";

  // Get a real item path for the example
  let exampleItemPath = `${exampleCollection}/example-item.json`;
  if (collections[0]?.config) {
    try {
      const { fetchFileAtPath } = await import("../../../lib/brevozaConfig");
      const collectionConfig = await fetchFileAtPath(owner, repo, branch, collections[0].config);
      if (collectionConfig.content) {
        const items = await fetchAllItemsForCollection(
          owner,
          repo,
          branch,
          exampleCollection,
          collectionConfig.content,
          { metadataOnly: true, limit: 1 }
        );
        if (items.items && items.items.length > 0) {
          exampleItemPath = items.items[0].path;
        }
      }
    } catch (e) {
      // Use default if fetching fails
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.brevoza.com";

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 font-sans dark:bg-black py-12">
      <main className="w-full max-w-4xl rounded-md bg-white p-8 shadow-sm dark:bg-black">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
              API Documentation
            </h1>
            <a
              href={`/${owner}/${repo}`}
              className="rounded-full border border-solid border-black/[.08] px-4 py-2 text-sm hover:bg-black/[.04] dark:border-white/[.145]"
            >
              Back to Repo
            </a>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            API endpoints for <code className="rounded bg-zinc-100 px-2 py-1 dark:bg-zinc-900">{owner}/{repo}</code>
          </p>
        </header>

        <div className="space-y-8">
          {/* List Collection Items */}
          <section className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900 dark:text-green-200">
                  GET
                </span>
                <h2 className="text-lg font-medium text-black dark:text-zinc-50">
                  List Collection Items
                </h2>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Get a list of all items in a collection (metadata only by default).
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">Endpoint</h3>
                <code className="block rounded-md bg-zinc-100 p-3 text-sm dark:bg-zinc-900">
                  {baseUrl}/api/list-collection-items
                </code>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">Query Parameters</h3>
                <table className="w-full text-sm">
                  <thead className="border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="pb-2 text-left font-medium">Parameter</th>
                      <th className="pb-2 text-left font-medium">Type</th>
                      <th className="pb-2 text-left font-medium">Required</th>
                      <th className="pb-2 text-left font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    <tr>
                      <td className="py-2 font-mono text-xs">owner</td>
                      <td className="py-2 text-zinc-600 dark:text-zinc-400">string</td>
                      <td className="py-2 text-red-600 dark:text-red-400">Yes</td>
                      <td className="py-2 text-zinc-600 dark:text-zinc-400">Repository owner</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-xs">repo</td>
                      <td className="py-2 text-zinc-600 dark:text-zinc-400">string</td>
                      <td className="py-2 text-red-600 dark:text-red-400">Yes</td>
                      <td className="py-2 text-zinc-600 dark:text-zinc-400">Repository name</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-xs">collection</td>
                      <td className="py-2 text-zinc-600 dark:text-zinc-400">string</td>
                      <td className="py-2 text-red-600 dark:text-red-400">Yes</td>
                      <td className="py-2 text-zinc-600 dark:text-zinc-400">Collection name</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-xs">branch</td>
                      <td className="py-2 text-zinc-600 dark:text-zinc-400">string</td>
                      <td className="py-2 text-zinc-600 dark:text-zinc-400">No</td>
                      <td className="py-2 text-zinc-600 dark:text-zinc-400">Branch name (default: main)</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-xs">page</td>
                      <td className="py-2 text-zinc-600 dark:text-zinc-400">number</td>
                      <td className="py-2 text-zinc-600 dark:text-zinc-400">No</td>
                      <td className="py-2 text-zinc-600 dark:text-zinc-400">Page number (default: 1)</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-xs">limit</td>
                      <td className="py-2 text-zinc-600 dark:text-zinc-400">number</td>
                      <td className="py-2 text-zinc-600 dark:text-zinc-400">No</td>
                      <td className="py-2 text-zinc-600 dark:text-zinc-400">Items per page (default: 50)</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-xs">includeContent</td>
                      <td className="py-2 text-zinc-600 dark:text-zinc-400">boolean</td>
                      <td className="py-2 text-zinc-600 dark:text-zinc-400">No</td>
                      <td className="py-2 text-zinc-600 dark:text-zinc-400">Include file content (default: false)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">Live Example</h3>
                <ApiExample
                  endpoint={`/api/list-collection-items?owner=${owner}&repo=${repo}&collection=${exampleCollection}&branch=${branch}&page=1&limit=5`}
                  method="GET"
                  title="Get first 5 items from collection"
                />
              </div>
            </div>
          </section>

          {/* Get Item Content */}
          <section className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900 dark:text-green-200">
                  GET
                </span>
                <h2 className="text-lg font-medium text-black dark:text-zinc-50">
                  Get Item Content
                </h2>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Retrieve the full content of a specific item file.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">Endpoint</h3>
                <code className="block rounded-md bg-zinc-100 p-3 text-sm dark:bg-zinc-900">
                  {baseUrl}/api/get-item-content
                </code>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">Query Parameters</h3>
                <table className="w-full text-sm">
                  <thead className="border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="pb-2 text-left font-medium">Parameter</th>
                      <th className="pb-2 text-left font-medium">Type</th>
                      <th className="pb-2 text-left font-medium">Required</th>
                      <th className="pb-2 text-left font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    <tr>
                      <td className="py-2 font-mono text-xs">owner</td>
                      <td className="py-2 text-zinc-600 dark:text-zinc-400">string</td>
                      <td className="py-2 text-red-600 dark:text-red-400">Yes</td>
                      <td className="py-2 text-zinc-600 dark:text-zinc-400">Repository owner</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-xs">repo</td>
                      <td className="py-2 text-zinc-600 dark:text-zinc-400">string</td>
                      <td className="py-2 text-red-600 dark:text-red-400">Yes</td>
                      <td className="py-2 text-zinc-600 dark:text-zinc-400">Repository name</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-xs">path</td>
                      <td className="py-2 text-zinc-600 dark:text-zinc-400">string</td>
                      <td className="py-2 text-red-600 dark:text-red-400">Yes</td>
                      <td className="py-2 text-zinc-600 dark:text-zinc-400">File path in repository</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-xs">branch</td>
                      <td className="py-2 text-zinc-600 dark:text-zinc-400">string</td>
                      <td className="py-2 text-zinc-600 dark:text-zinc-400">No</td>
                      <td className="py-2 text-zinc-600 dark:text-zinc-400">Branch name (default: main)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">Live Example</h3>
                <ApiExample
                  endpoint={`/api/get-item-content?owner=${owner}&repo=${repo}&path=${encodeURIComponent(exampleItemPath)}&branch=${branch}`}
                  method="GET"
                  title="Get content of a specific item"
                />
              </div>
            </div>
          </section>

          {/* Usage Notes */}
          <section className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
            <h2 className="mb-3 text-lg font-medium text-black dark:text-zinc-50">Usage Notes</h2>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex gap-2">
                <span className="text-zinc-400">•</span>
                <span>All endpoints support CORS and can be called from client-side applications.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-zinc-400">•</span>
                <span>Data is cached for 60 seconds to improve performance.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-zinc-400">•</span>
                <span>Use pagination parameters <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">page</code> and <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">limit</code> to paginate through large collections.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-zinc-400">•</span>
                <span>Use <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">includeContent=false</code> (default) for faster responses when you only need item metadata.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-zinc-400">•</span>
                <span>File paths should be URL-encoded (e.g., spaces become <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">%20</code>).</span>
              </li>
            </ul>
          </section>

          {/* Available Collections */}
          {collections.length > 0 && (
            <section className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
              <h2 className="mb-3 text-lg font-medium text-black dark:text-zinc-50">Available Collections</h2>
              <ul className="space-y-2">
                {collections.map((col) => (
                  <li key={col.name} className="text-sm">
                    <code className="rounded bg-zinc-100 px-2 py-1 dark:bg-zinc-900">{col.name}</code>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
