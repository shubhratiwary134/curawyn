import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContentObserver } from '../../src/content/observer';
import { DEFAULT_SETTINGS } from '../../src/core/defaults';
import { Decision } from '../../src/core/types';

describe('ContentObserver', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    document.body.innerHTML = '';
  });

  it('observes and processes newly inserted cards', async () => {
    const evaluator = vi.fn().mockReturnValue({
      action: 'show',
      reason: 'allowed'
    } as Decision);

    const observer = new ContentObserver(DEFAULT_SETTINGS, evaluator);
    observer.start();

    const card = document.createElement('ytd-rich-item-renderer');
    card.innerHTML = `
      <a id="thumbnail" href="/watch?v=video123456">
        <span id="text">10:00</span>
      </a>
      <a id="video-title">Test Video</a>
      <ytd-channel-name><a href="/@Channel">Channel</a></ytd-channel-name>
    `;
    container.appendChild(card);

    // Wait for microtask / rAF batch
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(card.getAttribute('data-yfc-state')).toBe('shown');
    expect(card.getAttribute('data-yfc-reason')).toBe('allowed');
    expect(evaluator).toHaveBeenCalledTimes(1);

    observer.stop();
  });

  it('renders debug overlay when settings.debug is true', async () => {
    const observer = new ContentObserver(
      { ...DEFAULT_SETTINGS, debug: true },
      () => ({ action: 'show', reason: 'allowed' })
    );
    observer.start();

    const card = document.createElement('ytd-rich-item-renderer');
    card.innerHTML = `
      <a id="thumbnail" href="/watch?v=video123456"></a>
      <a id="video-title">Debug Video</a>
    `;
    container.appendChild(card);

    await new Promise((resolve) => setTimeout(resolve, 50));

    const overlay = card.querySelector('.yfc-debug-overlay');
    expect(overlay).not.toBeNull();
    expect(overlay?.textContent).toContain('[SHOW] allowed');

    observer.stop();
  });

  it('applies hidden decision and state attribute', async () => {
    const observer = new ContentObserver(
      DEFAULT_SETTINGS,
      () => ({ action: 'hide', reason: 'shorts_blocked' })
    );
    observer.start();

    const card = document.createElement('ytd-rich-item-renderer');
    card.innerHTML = `
      <a id="thumbnail" href="/shorts/short123456"></a>
      <a id="video-title">Shorts Video</a>
    `;
    container.appendChild(card);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(card.getAttribute('data-yfc-state')).toBe('hidden');
    expect(card.getAttribute('data-yfc-reason')).toBe('shorts_blocked');

    observer.stop();
  });
});
