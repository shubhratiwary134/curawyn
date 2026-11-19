import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ShortsBlocker } from '../../src/content/shorts';
import { DEFAULT_SETTINGS } from '../../src/core/defaults';

describe('ShortsBlocker', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    document.body.innerHTML = '';
  });

  it('hides shorts shelves on feed', () => {
    const shelf = document.createElement('ytd-reel-shelf-renderer');
    container.appendChild(shelf);

    const blocker = new ShortsBlocker(DEFAULT_SETTINGS);
    blocker.applyShortsBlocking('home');

    expect(shelf.getAttribute('data-yfc-shorts-blocked')).toBe('true');
    expect(shelf.style.display).toBe('none');
  });

  it('hides shorts guide items in sidebar', () => {
    const guideItem = document.createElement('ytd-guide-entry-renderer');
    guideItem.innerHTML = '<a title="Shorts" href="/shorts">Shorts</a>';
    container.appendChild(guideItem);

    const blocker = new ShortsBlocker(DEFAULT_SETTINGS);
    blocker.applyShortsBlocking('home');

    expect(guideItem.getAttribute('data-yfc-shorts-blocked')).toBe('true');
    expect(guideItem.style.display).toBe('none');
  });

  it('restores all blocked shorts elements live when toggle is switched OFF', () => {
    const shelf = document.createElement('ytd-reel-shelf-renderer');
    container.appendChild(shelf);

    const blocker = new ShortsBlocker(DEFAULT_SETTINGS);
    blocker.applyShortsBlocking('home');
    expect(shelf.style.display).toBe('none');

    // Switch OFF
    blocker.updateSettings({
      ...DEFAULT_SETTINGS,
      shorts: {
        ...DEFAULT_SETTINGS.shorts,
        blockAll: false
      }
    });

    expect(shelf.getAttribute('data-yfc-shorts-blocked')).toBeNull();
    expect(shelf.style.display).toBe('');
  });

  it('redirects direct /shorts/URL to /watch?v= when directUrlBehavior = redirect', () => {
    const originalReplace = window.location.replace;
    window.location.replace = vi.fn();

    const blocker = new ShortsBlocker({
      ...DEFAULT_SETTINGS,
      shorts: {
        ...DEFAULT_SETTINGS.shorts,
        blockAll: true,
        directUrlBehavior: 'redirect'
      }
    });

    const handled = blocker.checkDirectShortsUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ');
    expect(handled).toBe(true);
    expect(window.location.replace).toHaveBeenCalledWith('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

    window.location.replace = originalReplace;
  });

  it('renders blocked interstitial when directUrlBehavior = block', () => {
    const blocker = new ShortsBlocker({
      ...DEFAULT_SETTINGS,
      shorts: {
        ...DEFAULT_SETTINGS.shorts,
        blockAll: true,
        directUrlBehavior: 'block'
      }
    });

    blocker.checkDirectShortsUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ');
    const interstitial = document.getElementById('yfc-shorts-blocked-interstitial');
    expect(interstitial).not.toBeNull();
    expect(interstitial?.textContent).toContain('Shorts Blocked');
  });
});
