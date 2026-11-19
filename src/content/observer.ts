import { SELECTORS } from './selectors';
import { extractCardMeta } from './extractCard';
import { applyDecision } from './applyDecision';
import { Decision, Settings, VideoMeta } from '../core/types';
import { detectSurface, getSurfaceMode } from './surfaces';

export type CardEvaluator = (
  meta: VideoMeta,
  cardEl: HTMLElement,
  settings: Settings
) => Promise<Decision> | Decision;

// Default stub evaluator: shows everything as 'allowed'
export const defaultStubEvaluator: CardEvaluator = () => ({
  action: 'show',
  reason: 'allowed'
});

export class ContentObserver {
  private observer: MutationObserver | null = null;
  private processedNodes = new WeakSet<HTMLElement>();
  private activeCards = new Set<HTMLElement>();
  private pendingBatch: HTMLElement[] = [];
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

    // Initial scan
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

    // Only apply anti-flicker on full / blacklistOnly surfaces; NEVER on search / bypass
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

    // If surface is bypassed, show everything and skip
    if (mode === 'bypass') {
      this.showBypassedNodes();
      return;
    }

    // Query candidate cards
    const selector = SELECTORS.cards.join(', ');
    const candidates = document.querySelectorAll(selector);

    for (let i = 0; i < candidates.length; i++) {
      const cardEl = candidates[i] as HTMLElement;
      if (this.processedNodes.has(cardEl)) continue;

      this.processedNodes.add(cardEl);
      this.activeCards.add(cardEl);
      this.processCard(cardEl);
    }
  }

  private async processCard(cardEl: HTMLElement): Promise<void> {
    const meta = extractCardMeta(cardEl);
    if (!meta) {
      // If unextractable (e.g. shelf header, ad), mark shown to remove anti-flicker hidden state
      cardEl.setAttribute('data-yfc-state', 'shown');
      cardEl.setAttribute('data-yfc-reason', 'allowed');
      return;
    }

    cardEl.setAttribute('data-yfc-state', 'pending');
    try {
      const decision = await this.evaluator(meta, cardEl, this.settings);
      applyDecision(cardEl, decision, meta, null, this.settings.debug);
    } catch (err) {
      console.error('[YFC] Error evaluating card:', err);
      // Fail-safe open on error
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
