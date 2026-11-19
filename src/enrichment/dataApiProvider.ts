import { EnrichedMetadata, MetadataProvider } from './types';

export function parseIsoDuration(durationStr: string): number | null {
  if (!durationStr) return null;
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

export class DataApiProvider implements MetadataProvider {
  public name = 'data-api';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  public async requestHostPermission(): Promise<boolean> {
    if (typeof chrome === 'undefined' || !chrome.permissions) {
      return false;
    }
    return new Promise((resolve) => {
      chrome.permissions.request(
        {
          origins: ['https://www.googleapis.com/*']
        },
        (granted) => {
          resolve(Boolean(granted));
        }
      );
    });
  }

  public async fetchMetadata(videoId: string): Promise<EnrichedMetadata | null> {
    const list = await this.fetchBatchMetadata([videoId]);
    return list[videoId] || null;
  }

  public async fetchBatchMetadata(
    videoIds: string[]
  ): Promise<Record<string, EnrichedMetadata>> {
    if (!this.apiKey || videoIds.length === 0) return {};

    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${encodeURIComponent(
      videoIds.slice(0, 50).join(',')
    )}&key=${encodeURIComponent(this.apiKey)}`;

    try {
      const resp = await fetch(url);
      if (!resp.ok) {
        if (resp.status === 429) {
          throw new Error('HTTP_429_RATE_LIMITED');
        }
        return {};
      }

      const json = await resp.json();
      const results: Record<string, EnrichedMetadata> = {};

      if (Array.isArray(json.items)) {
        for (const item of json.items) {
          const id = item.id;
          const snippet = item.snippet || {};
          const contentDetails = item.contentDetails || {};

          results[id] = {
            videoId: id,
            description: snippet.description || '',
            tags: Array.isArray(snippet.tags) ? snippet.tags : [],
            ytCategoryId: snippet.categoryId ? parseInt(snippet.categoryId, 10) : undefined,
            durationSec: parseIsoDuration(contentDetails.duration),
            isLive: snippet.liveBroadcastContent === 'live'
          };
        }
      }

      return results;
    } catch (err) {
      if (err instanceof Error && err.message === 'HTTP_429_RATE_LIMITED') {
        throw err;
      }
      return {};
    }
  }
}
