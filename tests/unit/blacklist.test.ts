import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { checkDirectBlockedUrl } from '../../src/content/blockedPage';
import { BlacklistManager } from '../../src/options/components/BlacklistManager';
import { injectCardHoverButton, showUndoToast } from '../../src/content/cardActions/hoverButton';
import { DEFAULT_SETTINGS } from '../../src/core/defaults';
import { Settings, VideoMeta } from '../../src/core/types';

describe('Blacklist Functionality', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    document.body.innerHTML = '';
  });

  it('detects direct URL to blacklisted video and renders interstitial', () => {
    const settings: Settings = {
      ...DEFAULT_SETTINGS,
      onboardingDone: true,
      blacklist: {
        ...DEFAULT_SETTINGS.blacklist,
        videos: {
          blocked123: { title: 'Toxic Clickbait', addedAt: Date.now() }
        }
      }
    };

    const intercepted = checkDirectBlockedUrl(settings, 'https://www.youtube.com/watch?v=blocked123');
    expect(intercepted).toBe(true);

    const interstitial = document.getElementById('yfc-blocked-interstitial');
    expect(interstitial).not.toBeNull();
    expect(interstitial?.textContent).toContain('Blocked by YouTube Feed Control');
    expect(interstitial?.textContent).toContain('Toxic Clickbait');
  });

  it('renders and unblocks items in BlacklistManager UI', () => {
    const settings: Settings = {
      ...DEFAULT_SETTINGS,
      blacklist: {
        ...DEFAULT_SETTINGS.blacklist,
        videos: {
          vidX: { title: 'Spam Video', addedAt: Date.now() }
        },
        channels: {
          chY: { channelId: 'chY', name: 'Spam Channel', addedAt: Date.now() }
        }
      }
    };

    const handleUpdate = vi.fn().mockImplementation((updater) => {
      const next = updater(settings);
      expect(next.blacklist.videos['vidX']).toBeUndefined();
      return Promise.resolve();
    });

    render(<BlacklistManager settings={settings} onUpdateSettings={handleUpdate} />);

    expect(screen.getByText('Spam Video')).toBeInTheDocument();
    expect(screen.getByText('Spam Channel')).toBeInTheDocument();

    const unblockBtn = screen.getByTestId('unblock-video-vidX');
    fireEvent.click(unblockBtn);

    expect(handleUpdate).toHaveBeenCalledTimes(1);
  });

  it('injects card hover button and provides Undo toast', () => {
    const card = document.createElement('div');
    container.appendChild(card);

    const meta: VideoMeta = {
      videoId: 'v100',
      title: 'Annoying Video',
      channel: { channelId: 'c100', name: 'Annoying Channel' },
      durationSec: 300,
      isShort: false,
      isLive: false,
      isUpcoming: false,
      watchedPct: null
    };

    const onCorrection = vi.fn();
    injectCardHoverButton(card, meta, null, DEFAULT_SETTINGS, onCorrection);

    const host = card.querySelector('.yfc-card-action-host');
    expect(host).not.toBeNull();

    // Test undo toast helper
    const onUndo = vi.fn().mockResolvedValue(undefined);
    showUndoToast('Blocked Video', onUndo);

    const toast = document.getElementById('yfc-undo-toast');
    expect(toast).not.toBeNull();
    expect(toast?.textContent).toContain('Blocked Video');

    const undoBtn = document.getElementById('yfc-toast-undo-btn');
    expect(undoBtn).not.toBeNull();
    fireEvent.click(undoBtn!);

    expect(onUndo).toHaveBeenCalledTimes(1);
  });
});
