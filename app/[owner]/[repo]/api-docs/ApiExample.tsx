"use client";

import { useState, useEffect } from "react";

type ApiExampleProps = {
  endpoint: string;
  method?: string;
  title: string;
};

export default function ApiExample({ endpoint, method = "GET", title }: ApiExampleProps) {
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExample = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const res = await fetch(endpoint);
        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || `HTTP ${res.status}`);
        } else {
          setResponse(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch');
      } finally {
        setLoading(false);
      }
    };

    fetchExample();
  }, [endpoint]);

  return (
    <div className="space-y-3">
      <div>
        <h3 className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {title}
        </h3>
        <div className="flex items-center gap-2 mb-2">
          <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900 dark:text-green-200">
            {method}
          </span>
          <code className="text-xs text-zinc-600 dark:text-zinc-400 break-all">
            {endpoint}
          </code>
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Response
        </h4>
        {loading ? (
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-600 dark:border-t-zinc-300"></div>
              <span>Loading...</span>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            <strong>Error:</strong> {error}
          </div>
        ) : (
          <pre className="overflow-x-auto rounded-md bg-zinc-100 p-4 text-xs leading-6 dark:bg-zinc-900">
            {JSON.stringify(response, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
