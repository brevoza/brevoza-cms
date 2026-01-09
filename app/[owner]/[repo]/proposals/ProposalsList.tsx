"use client";

import { useEffect, useState } from "react";

type PullRequest = {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  state: string;
  created_at: string;
  updated_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
  head: {
    ref: string;
  };
  base: {
    ref: string;
  };
};

export default function ProposalsList({ owner, repo }: { owner: string; repo: string }) {
  const [proposals, setProposals] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    fetchProposals();
  }, [owner, repo]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/list-prs?owner=${owner}&repo=${repo}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch proposals');
      }

      setProposals(data.pullRequests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (prNumber: number) => {
    setActionLoading(prev => ({ ...prev, [prNumber]: 'approving' }));
    
    try {
      const response = await fetch('/api/approve-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, prNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve proposal');
      }

      // Refresh the list
      await fetchProposals();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve proposal');
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[prNumber];
        return newState;
      });
    }
  };

  const handleReject = async (prNumber: number) => {
    if (!confirm('Are you sure you want to reject this proposal? This will close the pull request.')) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [prNumber]: 'rejecting' }));
    
    try {
      const response = await fetch('/api/reject-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, prNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject proposal');
      }

      // Refresh the list
      await fetchProposals();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reject proposal');
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[prNumber];
        return newState;
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-600 dark:text-zinc-400">Loading proposals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-600 dark:text-zinc-400">No open proposals found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {proposals.map((pr) => (
        <div
          key={pr.number}
          className="rounded-md border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <img
                  src={pr.user.avatar_url}
                  alt={pr.user.login}
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-xs text-zinc-500">
                  {pr.user.login}
                </span>
                <span className="text-xs text-zinc-400">•</span>
                <span className="text-xs text-zinc-500">
                  #{pr.number}
                </span>
              </div>
              
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-2">
                {pr.title}
              </h3>
              
              {pr.body && (
                <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-3 whitespace-pre-wrap line-clamp-3">
                  {pr.body}
                </div>
              )}

              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <span>
                  {pr.head.ref} → {pr.base.ref}
                </span>
                <span>•</span>
                <span>
                  Created {new Date(pr.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <a
                href={pr.html_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-solid border-zinc-300 px-3 py-1.5 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                View on GitHub
              </a>
              
              <button
                onClick={() => handleApprove(pr.number)}
                disabled={!!actionLoading[pr.number]}
                className="rounded-full border border-solid border-green-600 bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading[pr.number] === 'approving' ? 'Approving...' : 'Approve'}
              </button>
              
              <button
                onClick={() => handleReject(pr.number)}
                disabled={!!actionLoading[pr.number]}
                className="rounded-full border border-solid border-red-600 bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading[pr.number] === 'rejecting' ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
