"use client";

import { useState, useMemo } from "react";
import CollapsibleList, { CollapsibleItem } from "../../../components/CollapsibleList";

type ContentItem = {
  name: string;
  path: string;
  content?: string;
  error?: string;
};

type ItemsListProps = {
  items: ContentItem[];
  collectionName: string;
  owner: string;
  repo: string;
  branch?: string;
};

export default function ItemsList({ items, collectionName, owner, repo, branch = "main" }: ItemsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [itemContents, setItemContents] = useState<Record<string, { content?: string; error?: string; loading?: boolean }>>(
    {}
  );

  // Filter items based on search query (instant search on filenames)
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter((item) => 
      item.name.toLowerCase().includes(query) || 
      item.path.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  // Load content for an item when it's expanded
  const loadItemContent = async (item: ContentItem) => {
    // If content already exists (pre-loaded), use it
    if (item.content) return;
    
    // If already loaded or loading, skip
    if (itemContents[item.path]?.content || itemContents[item.path]?.loading) return;

    // Mark as loading
    setItemContents((prev) => ({
      ...prev,
      [item.path]: { loading: true },
    }));

    try {
      const response = await fetch(
        `/api/get-item-content?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(item.path)}&branch=${encodeURIComponent(branch)}`
      );

      const data = await response.json();

      if (!response.ok) {
        setItemContents((prev) => ({
          ...prev,
          [item.path]: { error: data.error || "Failed to load content" },
        }));
        return;
      }

      setItemContents((prev) => ({
        ...prev,
        [item.path]: { content: data.content },
      }));
    } catch (error) {
      setItemContents((prev) => ({
        ...prev,
        [item.path]: { error: "Failed to fetch content" },
      }));
    }
  };

  const collapsibleItems: CollapsibleItem<ContentItem>[] = filteredItems.map((item) => ({
    id: item.path,
    data: item,
  }));

  const renderHeader = (item: ContentItem) => (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
        {item.name}
      </span>
      <span className="text-xs text-zinc-500">{item.path}</span>
    </div>
  );

  const renderContent = (item: ContentItem) => {
    // Use pre-loaded content or lazily loaded content
    const loadedContent = itemContents[item.path];
    const content = item.content || loadedContent?.content;
    const error = item.error || loadedContent?.error;
    const loading = loadedContent?.loading;

    // Load content when expanded
    if (!content && !error && !loading) {
      loadItemContent(item);
    }

    if (loading) {
      return (
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
          Loading content...
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          <strong>Error:</strong> {error}
        </div>
      );
    }

    return (
      <pre className="max-h-[40vh] overflow-auto rounded-md bg-zinc-100 p-3 text-sm leading-6 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50">
        {content || "No content available."}
      </pre>
    );
  };

  return (
    <div>
      {/* Search bar */}
      <div className="mb-3">
        <input
          type="text"
          placeholder={`Search items in ${collectionName}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
        />
        {searchQuery && (
          <div className="mt-1 text-xs text-zinc-500">
            Showing {filteredItems.length} of {items.length} items
          </div>
        )}
      </div>

      <CollapsibleList
        items={collapsibleItems}
        renderHeader={renderHeader}
        renderContent={renderContent}
        emptyMessage={
          searchQuery
            ? `No items match "${searchQuery}" in ${collectionName}.`
            : `No items found in ${collectionName}.`
        }
      />
    </div>
  );
}
