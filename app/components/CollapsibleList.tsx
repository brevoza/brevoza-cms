"use client";

import { useState, ReactNode } from "react";

export type CollapsibleItem<T> = {
  id: string | number;
  data: T;
};

type CollapsibleListProps<T> = {
  items: CollapsibleItem<T>[];
  renderHeader: (item: T, isExpanded: boolean) => ReactNode;
  renderContent: (item: T) => ReactNode;
  renderActions?: (item: T) => ReactNode;
  onExpand?: (item: T) => void;
  emptyMessage?: string;
  loading?: boolean;
  loadingMessage?: string;
  error?: string | null;
};

export default function CollapsibleList<T>({
  items,
  renderHeader,
  renderContent,
  renderActions,
  onExpand,
  emptyMessage = "No items found.",
  loading = false,
  loadingMessage = "Loading...",
  error = null,
}: CollapsibleListProps<T>) {
  const [expandedIds, setExpandedIds] = useState<Set<string | number>>(new Set());

  const toggleExpand = (id: string | number, item: T) => {
    const newExpanded = new Set(expandedIds);

    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
      onExpand?.(item);
    }

    setExpandedIds(newExpanded);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-600 dark:text-zinc-400">{loadingMessage}</p>
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

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-600 dark:text-zinc-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => {
        const isExpanded = expandedIds.has(item.id);

        return (
          <div
            key={item.id}
            className="rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
          >
            {/* Header - Always visible */}
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <button
                  onClick={() => toggleExpand(item.id, item.data)}
                  className="flex-1 text-left"
                >
                  <div className="flex items-center gap-2">
                    <svg
                      className={`w-4 h-4 text-zinc-500 transition-transform ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <div className="flex-1">{renderHeader(item.data, isExpanded)}</div>
                  </div>
                </button>

                {renderActions && (
                  <div className="flex gap-2">{renderActions(item.data)}</div>
                )}
              </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t border-zinc-200 dark:border-zinc-800 p-5 bg-white dark:bg-zinc-950">
                {renderContent(item.data)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { CollapsibleList };
