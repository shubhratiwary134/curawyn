import { SELECTORS } from './selectors';
import { extractCardMeta } from './extractCard';
import { applyDecision } from './applyDecision';
import { Decision, Settings, VideoMeta } from '../core/types';
import { detectSurface, getSurfaceMode } from './surfaces';
import { evaluateExtractionHealth } from './health';

export type CardEvaluator = (
  meta: VideoMeta,
  cardEl: HTMLElement,
  settings: Settings
) => Promise<Decision> | Decision;

export const defaultStubEvaluator: CardEvaluator = () => ({
  action: 'show',
  reason: 'allowed'
});

export class ContentObserver {
  private observer: MutationObserver | null = null;
  private processedNodes = new WeakSet<HTMLElement>();
  private activeCards = new Set<HTMLElement>();
  private rafId: number | null = null;
  private settings: Settings;
  private evaluator: CardEvaluator;
  private antiFlickerStyle: HTMLStyleElement | null = null;

  constructor(settings: Settings, evaluator: CardEvaluator = defaultStubEvaluator) {
    this.settings = settings;
    this.evaluator = evaluator;
  }

  public updateSettings(newSettings: Settings): void {
    this.settings = newSettings;
    this.updateAntiFlicker();
    this.reEvaluateAll();
  }

  public setEvaluator(evaluator: CardEvaluator): void {
    this.evaluator = evaluator;
    this.reEvaluateAll();
  }

  public start(): void {
    this.updateAntiFlicker();

    if (!this.observer && typeof MutationObserver !== 'undefined') {
      this.observer = new MutationObserver((mutations) => {
        let hasNewNodes = false;
        for (const mut of mutations) {
          if (mut.addedNodes.length > 0) {
            hasNewNodes = true;
            break;
          }
        }
        if (hasNewNodes) {
          this.scheduleBatch();
        }
      });

      this.observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
    }

    this.scheduleBatch();
  }

  public stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public resetSession(): void {
    this.stop();
    this.activeCards.clear();
    this.processedNodes = new WeakSet<HTMLElement>();
    this.start();
  }

  public getActiveCards(): HTMLElement[] {
    return Array.from(this.activeCards);
  }

  private updateAntiFlicker(): void {
    const surface = detectSurface();
    const mode = getSurfaceMode(surface, this.settings);

    if (mode === 'bypass') {
      if (this.antiFlickerStyle) {
        this.antiFlickerStyle.remove();
        this.antiFlickerStyle = null;
      }
      return;
    }

    if (!this.antiFlickerStyle && typeof document !== 'undefined') {
      this.antiFlickerStyle = document.createElement('style');
      this.antiFlickerStyle.id = 'yfc-anti-flicker';
      this.antiFlickerStyle.textContent = `
        ytd-rich-item-renderer:not([data-yfc-state]),
        ytd-video-renderer:not([data-yfc-state]),
        ytd-compact-video-renderer:not([data-yfc-state]),
        ytd-grid-video-renderer:not([data-yfc-state]),
        yt-lockup-view-model:not([data-yfc-state]) {
          visibility: hidden !important;
        }
      `;
      (document.head || document.documentElement).appendChild(this.antiFlickerStyle);
    }
  }

  private scheduleBatch(): void {
    if (this.rafId !== null) return;

    const requestRaf =
      typeof requestAnimationFrame !== 'undefined'
        ? requestAnimationFrame
        : (cb: () => void) => setTimeout(cb, 16);

    this.rafId = requestRaf(() => {
      this.rafId = null;
      this.processBatch();
    });
  }

  private processBatch(): void {
    const surface = detectSurface();
    const mode = getSurfaceMode(surface, this.settings);

    if (mode === 'bypass') {
      this.showBypassedNodes();
      return;
    }

    const selector = SELECTORS.cards.join(', ');
    const candidates = document.querySelectorAll(selector);

    let parsedCount = 0;
    const cardsToProcess: { cardEl: HTMLElement; meta: VideoMeta }[] = [];

    // Phase 1: Batch DOM reads
    for (let i = 0; i < candidates.length; i++) {
      const cardEl = candidates[i] as HTMLElement;
      if (this.processedNodes.has(cardEl)) continue;

      this.processedNodes.add(cardEl);
      this.activeCards.add(cardEl);

      const meta = extractCardMeta(cardEl);
      if (meta) {
        parsedCount++;
        cardsToProcess.push({ cardEl, meta });
      } else {
        // Fallback for non-video items in grid
        cardEl.setAttribute('data-yfc-state', 'shown');
        cardEl.setAttribute('data-yfc-reason', 'allowed');
      }
    }

    // Health check evaluation: fail-open if broken
    const health = evaluateExtractionHealth(candidates.length, parsedCount, mode);
    if (health.extractionBroken) {
      for (const item of cardsToProcess) {
        applyDecision(
          item.cardEl,
          { action: 'show', reason: 'allowed', detail: 'fail_open' },
          item.meta,
          null,
          this.settings.debug
        );
      }
      return;
    }

    // Phase 2: Batch DOM writes / pipeline execution
    for (const item of cardsToProcess) {
      this.processCard(item.cardEl, item.meta);
    }
  }

  private async processCard(cardEl: HTMLElement, meta: VideoMeta): Promise<void> {
    cardEl.setAttribute('data-yfc-state', 'pending');
    try {
      const decision = await this.evaluator(meta, cardEl, this.settings);
      applyDecision(cardEl, decision, meta, null, this.settings.debug);
    } catch (err) {
      console.error('[YFC] Error evaluating card:', err);
      applyDecision(
        cardEl,
        { action: 'show', reason: 'allowed', detail: 'evaluator_error' },
        meta,
        null,
        this.settings.debug
      );
    }
  }

  private showBypassedNodes(): void {
    const selector = SELECTORS.cards.join(', ');
    const candidates = document.querySelectorAll(selector);
    for (let i = 0; i < candidates.length; i++) {
      const cardEl = candidates[i] as HTMLElement;
      if (!this.processedNodes.has(cardEl)) {
        this.processedNodes.add(cardEl);
        this.activeCards.add(cardEl);
        cardEl.setAttribute('data-yfc-state', 'shown');
        cardEl.setAttribute('data-yfc-reason', 'allowed');
      }
    }
  }

  private async reEvaluateAll(): Promise<void> {
    const cards = Array.from(this.activeCards);
    for (const cardEl of cards) {
      const meta = extractCardMeta(cardEl);
      if (meta) {
        const decision = await this.evaluator(meta, cardEl, this.settings);
        applyDecision(cardEl, decision, meta, null, this.settings.debug);
      }
    }
  }
}
