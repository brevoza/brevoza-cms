import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const path = searchParams.get('path');
    const branch = searchParams.get('branch') || 'main';

    if (!owner || !repo || !path) {
      return NextResponse.json(
        { error: 'Missing required parameters: owner, repo, path' },
        { status: 400 }
      );
    }

    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${encodeURIComponent(path)}`;

    try {
      const res = await fetch(url, { next: { revalidate: 60 } });
      
      if (!res.ok) {
        return NextResponse.json(
          { error: `Failed to fetch file: ${res.status} ${res.statusText}` },
          { status: res.status }
        );
      }

      const content = await res.text();

      return NextResponse.json({
        success: true,
        content,
        path,
      });
    } catch (fetchError) {
      return NextResponse.json(
        { error: `Failed to fetch file content: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in get-item-content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
