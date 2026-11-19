import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseWatchPageHtml } from '../../src/enrichment/watchPageProvider';
import { parseIsoDuration } from '../../src/enrichment/dataApiProvider';
import { EnrichmentQueue } from '../../src/enrichment/enrichmentQueue';
import { MetadataProvider, EnrichedMetadata } from '../../src/enrichment/types';

describe('Watch Page HTML Parser', () => {
  it('parses ytInitialPlayerResponse from saved HTML fixture', () => {
    const fixturePath = path.resolve(__dirname, '../fixtures/html/watchPageResponse.html');
    const html = fs.readFileSync(fixturePath, 'utf-8');

    const meta = parseWatchPageHtml(html, 'testVid123');
    expect(meta).not.toBeNull();
    expect(meta?.videoId).toBe('testVid123');
    expect(meta?.durationSec).toBe(1520);
    expect(meta?.tags).toEqual(['quantum', 'computing', 'qubits', 'physics']);
    expect(meta?.description).toContain('superconducting qubits');
    expect(meta?.isLive).toBe(false);
    expect(meta?.ytCategoryId).toBe(28); // Science & Technology
  });
});

describe('Data API ISO Duration Parser', () => {
  it('parses ISO 8601 durations correctly', () => {
    expect(parseIsoDuration('PT15M33S')).toBe(933);
    expect(parseIsoDuration('PT1H2M10S')).toBe(3730);
    expect(parseIsoDuration('PT45S')).toBe(45);
    expect(parseIsoDuration('PT2H')).toBe(7200);
    expect(parseIsoDuration('invalid')).toBeNull();
  });
});

describe('Enrichment Queue', () => {
  it('enqueues and processes requests respecting concurrency and order', async () => {
    let currentConcurrent = 0;
    let maxSeenConcurrent = 0;

    const mockProvider: MetadataProvider = {
      name: 'mock',
      fetchMetadata: vi.fn().mockImplementation(async (id: string) => {
        currentConcurrent++;
        maxSeenConcurrent = Math.max(maxSeenConcurrent, currentConcurrent);
        await new Promise((r) => setTimeout(r, 20));
        currentConcurrent--;
        return { videoId: id } as EnrichedMetadata;
      })
    };

    const queue = new EnrichmentQueue(mockProvider);
    const p1 = queue.enqueue('v1', 1);
    const p2 = queue.enqueue('v2', 2); // higher priority
    const p3 = queue.enqueue('v3', 1);

    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

    expect(r1?.videoId).toBe('v1');
    expect(r2?.videoId).toBe('v2');
    expect(r3?.videoId).toBe('v3');
    expect(maxSeenConcurrent).toBeLessThanOrEqual(2);
  });

  it('cancels pending requests on queue.clear() (e.g. SPA navigation)', async () => {
    const mockProvider: MetadataProvider = {
      name: 'mock',
      fetchMetadata: vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ videoId: 'done' }), 200))
      )
    };

    const queue = new EnrichmentQueue(mockProvider);
    queue.enqueue('v1');
    queue.enqueue('v2');
    const p3 = queue.enqueue('v3');

    // Navigation occurs immediately
    queue.clear();
    expect(queue.getQueueLength()).toBe(0);

    const res3 = await p3;
    expect(res3).toBeNull();
  });
});
