import { NextResponse } from 'next/server';
import { getOctokitForOwner } from '../../lib/github';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const state = searchParams.get('state') || 'open';

    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'Missing required parameters: owner, repo' },
        { status: 400 }
      );
    }

    const result = await getOctokitForOwner(owner);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { octokit } = result;

    // List pull requests
    const { data: pullRequests } = await octokit.rest.pulls.list({
      owner,
      repo,
      state: state as 'open' | 'closed' | 'all',
      sort: 'created',
      direction: 'desc',
      per_page: 100,
    });

    return NextResponse.json({
      success: true,
      pullRequests,
    });
  } catch (error) {
    console.error('Error listing PRs:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list PRs' },
      { status: 500 }
    );
  }
}
