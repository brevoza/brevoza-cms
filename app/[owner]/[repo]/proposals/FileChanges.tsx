type FileChange = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
};

export default function FileChanges({ files }: { files: FileChange[] }) {
  const parseDiffLine = (line: string) => {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      return { type: 'addition', content: line };
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      return { type: 'deletion', content: line };
    } else if (line.startsWith('@@')) {
      return { type: 'hunk', content: line };
    } else {
      return { type: 'context', content: line };
    }
  };

  const getLineClassName = (type: string) => {
    switch (type) {
      case 'addition':
        return 'bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-100';
      case 'deletion':
        return 'bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-100';
      case 'hunk':
        return 'bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100';
      default:
        return 'text-zinc-800 dark:text-zinc-200';
    }
  };

  if (files.length === 0) {
    return (
      <div className="text-sm text-zinc-500 py-4">
        No file changes found.
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-50 mb-3">
        File Changes ({files.length})
      </h4>
      <div className="flex flex-col gap-3">
        {files.map((file, idx) => {
          const lines = file.patch ? file.patch.split('\n') : [];
          
          return (
            <div
              key={idx}
              className="rounded border border-zinc-200 dark:border-zinc-800 overflow-hidden"
            >
              <div className="bg-zinc-100 dark:bg-zinc-900 px-3 py-2 flex items-center justify-between">
                <span className="text-sm font-mono text-zinc-900 dark:text-zinc-50">
                  {file.filename}
                </span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    +{file.additions}
                  </span>
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    -{file.deletions}
                  </span>
                </div>
              </div>
              {file.patch && (
                <div className="text-xs overflow-x-auto bg-white dark:bg-zinc-950">
                  {lines.map((line, lineIdx) => {
                    const parsed = parseDiffLine(line);
                    return (
                      <div
                        key={lineIdx}
                        className={`px-3 py-0.5 font-mono ${getLineClassName(parsed.type)}`}
                      >
                        {parsed.content || '\u00A0'}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
