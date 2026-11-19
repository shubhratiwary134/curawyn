export class ContinuationNudger {
  private nudgeCount = 0;
  private readonly maxNudgesPerBatch = 5;
  private readonly minVisibleCards = 12;
  private lastNudgeTime = 0;

  public checkAndNudge(container: HTMLElement | Document = document): boolean {
    if (typeof window === 'undefined') return false;

    const visibleCards = container.querySelectorAll(
      '[data-yfc-state="shown"], [data-yfc-state="pending"]'
    );
    const hiddenCards = container.querySelectorAll('[data-yfc-state="hidden"]');

    // Only nudge if there are hidden cards and visible count is below threshold
    if (hiddenCards.length > 0 && visibleCards.length < this.minVisibleCards) {
      if (this.nudgeCount < this.maxNudgesPerBatch) {
        const now = Date.now();
        if (now - this.lastNudgeTime > 500) {
          // Throttled
          this.nudgeCount++;
          this.lastNudgeTime = now;
          this.performNudge();
          return true;
        }
      }
    }
    return false;
  }

  public resetBatch(): void {
    this.nudgeCount = 0;
  }

  private performNudge(): void {
    // 1. Dispatch a scroll event / tiny window nudge
    window.scrollBy(0, 10);
    window.scrollBy(0, -10);

    // 2. Dispatch a scroll event to notify YouTube's scroll listeners
    window.dispatchEvent(new Event('scroll'));

    // 3. Look for YouTube's continuation loader/spinner
    const spinner = document.querySelector('ytd-continuation-item-renderer');
    if (spinner) {
      spinner.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }
}
