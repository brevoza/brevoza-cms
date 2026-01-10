"use client";

import { useEffect, useState } from "react";
import FileChanges from "./FileChanges";
import CollapsibleList, { CollapsibleItem } from "../../../components/CollapsibleList";

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

type FileChange = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
};

export default function ProposalsList({ owner, repo }: { owner: string; repo: string }) {
  const [proposals, setProposals] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{ [key: number]: string }>({});
  const [fileChanges, setFileChanges] = useState<{ [key: number]: FileChange[] }>({});
  const [loadingChanges, setLoadingChanges] = useState<Set<number>>(new Set());

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

  const fetchFileChanges = async (prNumber: number) => {
    // Fetch file changes if not already loaded
    if (!fileChanges[prNumber] && !loadingChanges.has(prNumber)) {
      setLoadingChanges(prev => new Set(prev).add(prNumber));
      
      try {
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`,
          {
            headers: {
              'Accept': 'application/vnd.github.v3+json',
            },
          }
        );
        
        if (response.ok) {
          const files = await response.json();
          setFileChanges(prev => ({ ...prev, [prNumber]: files }));
        }
      } catch (err) {
        console.error('Failed to fetch file changes:', err);
      } finally {
        setLoadingChanges(prev => {
          const newSet = new Set(prev);
          newSet.delete(prNumber);
          return newSet;
        });
      }
    }
  };

  const collapsibleItems: CollapsibleItem<PullRequest>[] = proposals.map((pr) => ({
    id: pr.number,
    data: pr,
  }));

  const renderHeader = (pr: PullRequest) => (
    <>
      <div className="flex items-center gap-2 mb-2">
        <img
          src={pr.user.avatar_url}
          alt={pr.user.login}
          className="w-6 h-6 rounded-full"
        />
        <span className="text-xs text-zinc-500">{pr.user.login}</span>
        <span className="text-xs text-zinc-400">•</span>
        <span className="text-xs text-zinc-500">#{pr.number}</span>
      </div>
      <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
        {pr.title}
      </h3>
    </>
  );

  const renderActions = (pr: PullRequest) => (
    <>
      <a
        href={pr.html_url}
        target="_blank"
        rel="noreferrer"
        className="rounded-full border border-solid border-zinc-300 px-3 py-1.5 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        View on GitHub
      </a>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleApprove(pr.number);
        }}
        disabled={!!actionLoading[pr.number]}
        className="rounded-full border border-solid border-green-600 bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {actionLoading[pr.number] === 'approving' ? 'Approving...' : 'Approve'}
      </button>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleReject(pr.number);
        }}
        disabled={!!actionLoading[pr.number]}
        className="rounded-full border border-solid border-red-600 bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {actionLoading[pr.number] === 'rejecting' ? 'Rejecting...' : 'Reject'}
      </button>
    </>
  );

  const renderContent = (pr: PullRequest) => {
    const changes = fileChanges[pr.number];
    const isLoadingChanges = loadingChanges.has(pr.number);

    return (
      <>
        {pr.body && (
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 whitespace-pre-wrap">
            {pr.body}
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-zinc-500 mb-4">
          <span>
            {pr.head.ref} → {pr.base.ref}
          </span>
          <span>•</span>
          <span>
            Created {new Date(pr.created_at).toLocaleDateString()}
          </span>
        </div>

        {isLoadingChanges && (
          <div className="text-sm text-zinc-500 py-4">
            Loading file changes...
          </div>
        )}

        {changes && <FileChanges files={changes} />}
      </>
    );
  };

  return (
    <CollapsibleList
      items={collapsibleItems}
      renderHeader={renderHeader}
      renderContent={renderContent}
      renderActions={renderActions}
      onExpand={(pr) => fetchFileChanges(pr.number)}
      loading={loading}
      loadingMessage="Loading proposals..."
      error={error}
      emptyMessage="No open proposals found."
    />
  );
}
