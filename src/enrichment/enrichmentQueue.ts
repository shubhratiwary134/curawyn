import { EnrichedMetadata, MetadataProvider } from './types';

export interface QueueItem {
  videoId: string;
  priority: number;
  resolve: (meta: EnrichedMetadata | null) => void;
  reject: (err: unknown) => void;
}

export class EnrichmentQueue {
  private queue: QueueItem[] = [];
  private activeCount = 0;
  private readonly maxConcurrency = 2;
  private readonly minIntervalMs = 250; // Max 4 req/sec
  private lastRequestTime = 0;
  private provider: MetadataProvider;
  private backoffMultiplier = 1;
  private inflight = new Map<string, Promise<EnrichedMetadata | null>>();

  constructor(provider: MetadataProvider) {
    this.provider = provider;
  }

  public setProvider(provider: MetadataProvider): void {
    this.provider = provider;
  }

  public enqueue(videoId: string, priority = 0): Promise<EnrichedMetadata | null> {
    if (this.inflight.has(videoId)) {
      return this.inflight.get(videoId)!;
    }

    const promise = new Promise<EnrichedMetadata | null>((resolve, reject) => {
      this.queue.push({ videoId, priority, resolve, reject });
      this.queue.sort((a, b) => b.priority - a.priority);
      this.processNext();
    });

    this.inflight.set(videoId, promise);
    promise.finally(() => {
      this.inflight.delete(videoId);
    });

    return promise;
  }

  public clear(): void {
    // Cancel / clear all pending requests (e.g. on SPA navigation)
    for (const item of this.queue) {
      item.resolve(null);
    }
    this.queue = [];
    this.inflight.clear();
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  private async processNext(): Promise<void> {
    if (this.activeCount >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const now = Date.now();
    const delay = Math.max(0, this.lastRequestTime + this.minIntervalMs * this.backoffMultiplier - now);

    if (delay > 0) {
      setTimeout(() => this.processNext(), delay);
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    this.activeCount++;
    this.lastRequestTime = Date.now();

    try {
      const meta = await this.provider.fetchMetadata(item.videoId);
      this.backoffMultiplier = 1; // Reset backoff on success
      item.resolve(meta);
    } catch (err) {
      if (err instanceof Error && err.message.includes('429')) {
        // Exponential backoff
        this.backoffMultiplier = Math.min(16, this.backoffMultiplier * 2);
        console.warn(`[YFC] Rate limited (429), increasing backoff to ${this.backoffMultiplier}x`);
      }
      item.resolve(null);
    } finally {
      this.activeCount--;
      this.processNext();
    }
  }
}
