import { Settings, SurfaceId } from '../core/types';
import { SELECTORS } from './selectors';
import { extractVideoId } from './extractCard';

export class ShortsBlocker {
  private settings: Settings;
  private checkIntervalId: number | null = null;

  constructor(settings: Settings) {
    this.settings = settings;
  }

  public updateSettings(newSettings: Settings): void {
    const wasBlocking = this.settings.shorts.blockAll;
    this.settings = newSettings;
    const isBlocking = this.settings.shorts.blockAll;

    if (!wasBlocking && isBlocking) {
      this.applyShortsBlocking();
    } else if (wasBlocking && !isBlocking) {
      this.restoreAllShorts();
    }
  }

  public start(): void {
    this.checkDirectShortsUrl();
    this.applyShortsBlocking();

    // Check periodically for dynamically injected shelves / guide
    if (typeof window !== 'undefined' && !this.checkIntervalId) {
      this.checkIntervalId = window.setInterval(() => {
        this.checkDirectShortsUrl();
        this.applyShortsBlocking();
      }, 500);
    }
  }

  public stop(): void {
    if (this.checkIntervalId !== null && typeof window !== 'undefined') {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
  }

  public checkDirectShortsUrl(urlStr: string = window.location.href): boolean {
    if (!this.settings.shorts.blockAll) return false;

    try {
      const url = new URL(urlStr);
      if (url.pathname.startsWith('/shorts/')) {
        const videoId = extractVideoId(url.pathname);
        if (videoId) {
          if (this.settings.shorts.directUrlBehavior === 'redirect') {
            const newUrl = `${url.origin}/watch?v=${videoId}`;
            console.log(`[YFC] Redirecting direct Shorts URL to watch player: ${newUrl}`);
            window.location.replace(newUrl);
            return true;
          } else {
            // "block" behavior: stop player and render blocked interstitial
            this.renderShortsBlockedInterstitial(videoId);
            return true;
          }
        }
      }
    } catch (_e) {
      // Ignore URL parse error
    }
    return false;
  }

  public applyShortsBlocking(surfaceId: SurfaceId = 'home'): void {
    if (!this.settings.shorts.blockAll) {
      return;
    }

    if (typeof document === 'undefined') return;

    // 1. Hide Shorts Guide and Mini-guide items
    const guideSelectors = SELECTORS.shortsGuideItems.join(', ');
    const guideItems = document.querySelectorAll(guideSelectors);
    guideItems.forEach((el) => {
      const parent = el.closest('ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer, yt-tab-shape, tp-yt-paper-tab') as HTMLElement || el as HTMLElement;
      parent.setAttribute('data-yfc-shorts-blocked', 'true');
      parent.style.setProperty('display', 'none', 'important');
    });

    // 2. Hide Shorts Shelves
    // In search surface: only hide shelves if shorts.hideInSearch is true
    if (surfaceId === 'search' && !this.settings.shorts.hideInSearch) {
      return;
    }

    const shelfSelectors = SELECTORS.shortsShelves.join(', ');
    const shelves = document.querySelectorAll(shelfSelectors);
    shelves.forEach((el) => {
      const container = (el.closest('ytd-rich-section-renderer') as HTMLElement) || (el as HTMLElement);
      container.setAttribute('data-yfc-shorts-blocked', 'true');
      container.style.setProperty('display', 'none', 'important');
    });
  }

  public restoreAllShorts(): void {
    if (typeof document === 'undefined') return;

    const blockedElements = document.querySelectorAll('[data-yfc-shorts-blocked="true"]');
    blockedElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      htmlEl.removeAttribute('data-yfc-shorts-blocked');
      htmlEl.style.removeProperty('display');
    });

    const interstitial = document.getElementById('yfc-shorts-blocked-interstitial');
    if (interstitial) {
      interstitial.remove();
    }
  }

  private renderShortsBlockedInterstitial(videoId: string): void {
    if (document.getElementById('yfc-shorts-blocked-interstitial')) return;

    // Pause any playing media immediately
    const videos = document.querySelectorAll('video');
    videos.forEach((v) => {
      v.pause();
      v.muted = true;
    });

    const overlay = document.createElement('div');
    overlay.id = 'yfc-shorts-blocked-interstitial';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = '#0f0f0f';
    overlay.style.color = '#fff';
    overlay.style.zIndex = '2147483647';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.fontFamily = 'Roboto, sans-serif';

    overlay.innerHTML = `
      <div style="text-align: center; max-width: 480px; padding: 24px;">
        <h1 style="color: #ff4444; font-size: 24px; margin-bottom: 12px;">Shorts Blocked</h1>
        <p style="color: #aaa; font-size: 14px; margin-bottom: 24px;">
          Direct Shorts playback is blocked by YouTube Feed Control settings.
        </p>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button id="yfc-btn-go-back" style="padding: 10px 20px; background-color: #333; color: #fff; border: none; border-radius: 4px; cursor: pointer;">
            Go Back
          </button>
          <a href="/watch?v=${videoId}" style="padding: 10px 20px; background-color: #065fd4; color: #fff; text-decoration: none; border-radius: 4px;">
            Open in Normal Player
          </a>
        </div>
      </div>
    `;

    document.documentElement.appendChild(overlay);

    document.getElementById('yfc-btn-go-back')?.addEventListener('click', () => {
      window.history.back();
    });
  }
}
