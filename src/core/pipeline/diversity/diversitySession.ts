export class DiversitySessionState {
  public sessionId: string;
  public surfaceId: string;
  public channelVideoCounts: Map<string, number> = new Map();
  public renderedVideoIds: Set<string> = new Set();
  public acceptedVideoIds: Set<string> = new Set();
  public subgenreWindowQueue: string[] = [];

  constructor(surfaceId: string, sessionId: string = `ds_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`) {
    this.surfaceId = surfaceId;
    this.sessionId = sessionId;
  }

  public recordAcceptedCard(
    videoId: string,
    channelKey: string | null,
    subgenreId: string | null,
    maxWindowW = 12
  ): void {
    this.acceptedVideoIds.add(videoId);
    this.renderedVideoIds.add(videoId);

    if (channelKey) {
      const current = this.channelVideoCounts.get(channelKey) || 0;
      this.channelVideoCounts.set(channelKey, current + 1);
    }

    if (subgenreId) {
      this.subgenreWindowQueue.push(subgenreId);
      if (this.subgenreWindowQueue.length > maxWindowW) {
        this.subgenreWindowQueue.shift();
      }
    }
  }

  public reset(): void {
    this.channelVideoCounts.clear();
    this.renderedVideoIds.clear();
    this.acceptedVideoIds.clear();
    this.subgenreWindowQueue = [];
  }
}
