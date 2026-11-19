import { EnrichedMetadata, MetadataProvider } from './types';

/**
 * Extracts and parses ytInitialPlayerResponse JSON from a watch page HTML string.
 */
export function parseWatchPageHtml(html: string, videoId: string): EnrichedMetadata | null {
  try {
    let jsonStr: string | null = null;

    // Pattern 1: ytInitialPlayerResponse = { ... };
    const marker = 'ytInitialPlayerResponse = ';
    const startIdx = html.indexOf(marker);
    if (startIdx !== -1) {
      const sub = html.slice(startIdx + marker.length);
      // Find end of JS statement
      const endIdx = sub.indexOf(';</script>');
      if (endIdx !== -1) {
        jsonStr = sub.slice(0, endIdx);
      } else {
        const altEnd = sub.indexOf('};');
        if (altEnd !== -1) {
          jsonStr = sub.slice(0, altEnd + 1);
        }
      }
    }

    // Pattern 2: var ytInitialPlayerResponse = { ... }
    if (!jsonStr) {
      const match = html.match(/var\s+ytInitialPlayerResponse\s*=\s*({.+?});/s);
      if (match) {
        jsonStr = match[1];
      }
    }

    if (!jsonStr) {
      return null;
    }

    const data = JSON.parse(jsonStr) as Record<string, unknown>;
    const videoDetails = (data.videoDetails as Record<string, unknown>) || {};
    const microformat = (data.microformat as Record<string, unknown>) || {};
    const playerMicroformat =
      (microformat.playerMicroformatRenderer as Record<string, unknown>) || {};

    const description =
      typeof videoDetails.shortDescription === 'string'
        ? videoDetails.shortDescription
        : undefined;

    const tags = Array.isArray(videoDetails.keywords)
      ? (videoDetails.keywords as string[])
      : undefined;

    let durationSec: number | null = null;
    if (typeof videoDetails.lengthSeconds === 'string') {
      durationSec = parseInt(videoDetails.lengthSeconds, 10) || null;
    }

    const isLive = Boolean(videoDetails.isLiveContent);

    // YouTube category ID can be in category field or numeric
    let ytCategoryId: number | undefined;
    if (typeof playerMicroformat.category === 'string') {
      // Map category name to ID or parse
      ytCategoryId = parseCategoryNameToId(playerMicroformat.category);
    }

    return {
      videoId,
      description,
      tags,
      durationSec,
      isLive,
      ytCategoryId
    };
  } catch (err) {
    console.warn('[YFC] Failed to parse watch page HTML:', err);
    return null;
  }
}

function parseCategoryNameToId(catName: string): number | undefined {
  const norm = catName.toLowerCase();
  if (norm.includes('film') || norm.includes('animation')) return 1;
  if (norm.includes('auto') || norm.includes('vehicle')) return 2;
  if (norm.includes('music')) return 10;
  if (norm.includes('sport')) return 17;
  if (norm.includes('travel')) return 19;
  if (norm.includes('gaming')) return 20;
  if (norm.includes('people') || norm.includes('blog')) return 22;
  if (norm.includes('comedy')) return 23;
  if (norm.includes('entertainment')) return 24;
  if (norm.includes('news') || norm.includes('politics')) return 25;
  if (norm.includes('howto') || norm.includes('style')) return 26;
  if (norm.includes('education')) return 27;
  if (norm.includes('science') || norm.includes('technology')) return 28;
  return undefined;
}

export class WatchPageProvider implements MetadataProvider {
  public name = 'watch-page';

  public async fetchMetadata(videoId: string): Promise<EnrichedMetadata | null> {
    try {
      const resp = await fetch(`/watch?v=${encodeURIComponent(videoId)}`, {
        credentials: 'same-origin',
        headers: {
          'Accept': 'text/html'
        }
      });

      if (!resp.ok) {
        if (resp.status === 429) {
          throw new Error('HTTP_429_RATE_LIMITED');
        }
        return null;
      }

      const html = await resp.text();
      return parseWatchPageHtml(html, videoId);
    } catch (err) {
      if (err instanceof Error && err.message === 'HTTP_429_RATE_LIMITED') {
        throw err;
      }
      return null;
    }
  }
}
