"use client";

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
};

export default function ItemsList({ items, collectionName }: ItemsListProps) {
  const collapsibleItems: CollapsibleItem<ContentItem>[] = items.map((item) => ({
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
    if (item.error) {
      return (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <strong>Error:</strong> {item.error}
        </div>
      );
    }

    return (
      <pre className="max-h-[40vh] overflow-auto rounded-md bg-zinc-100 p-3 text-sm leading-6 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50">
        {item.content || "No content available."}
      </pre>
    );
  };

  return (
    <CollapsibleList
      items={collapsibleItems}
      renderHeader={renderHeader}
      renderContent={renderContent}
      emptyMessage={`No items found in ${collectionName}.`}
    />
  );
}
