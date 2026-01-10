import { NextResponse } from 'next/server';
import { fetchBrevozaConfig, parseCollectionsFromConfig, fetchFileAtPath, fetchAllItemsForCollection } from '../../lib/brevozaConfig';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const collection = searchParams.get('collection');
    const branch = searchParams.get('branch') || 'main';
    const includeContent = searchParams.get('includeContent') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!owner || !repo || !collection) {
      return NextResponse.json(
        { error: 'Missing required parameters: owner, repo, collection' },
        { status: 400 }
      );
    }

    try {
      // Fetch brevoza config
      const brevozaConfig = await fetchBrevozaConfig(owner, repo, branch);
      if (brevozaConfig.error) {
        return NextResponse.json(
          { error: brevozaConfig.error },
          { status: 404 }
        );
      }

      // Find the collection
      const collections = parseCollectionsFromConfig(brevozaConfig.content ?? '');
      const collectionEntry = collections.find((c) => c.name === collection);

      if (!collectionEntry) {
        return NextResponse.json(
          { error: `Collection '${collection}' not found in brevoza.config.yml` },
          { status: 404 }
        );
      }

      if (!collectionEntry.config) {
        return NextResponse.json(
          { error: `Collection '${collection}' has no config file specified` },
          { status: 400 }
        );
      }

      // Fetch collection config
      const collectionConfig = await fetchFileAtPath(owner, repo, branch, collectionEntry.config);
      if (collectionConfig.error) {
        return NextResponse.json(
          { error: collectionConfig.error },
          { status: 404 }
        );
      }

      // Fetch items with pagination
      const result = await fetchAllItemsForCollection(
        owner,
        repo,
        branch,
        collection,
        collectionConfig.content,
        { metadataOnly: !includeContent }
      );

      if (result.error) {
        return NextResponse.json(
          { error: result.error },
          { status: 404 }
        );
      }

      const allItems = result.items || [];
      const totalCount = result.totalCount || allItems.length;
      
      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedItems = allItems.slice(startIndex, endIndex);
      const totalPages = Math.ceil(totalCount / limit);

      return NextResponse.json({
        success: true,
        collection,
        items: paginatedItems,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      });
    } catch (fetchError) {
      return NextResponse.json(
        { error: `Failed to fetch collection items: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in list-collection-items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
