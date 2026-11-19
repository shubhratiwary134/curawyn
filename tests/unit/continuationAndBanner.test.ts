import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ContinuationNudger } from '../../src/content/continuation';
import { showEmptyFeedBanner, removeEmptyFeedBanner } from '../../src/content/emptyBanner';
import { OnboardingModal } from '../../src/options/components/OnboardingModal';
import { DEFAULT_SETTINGS } from '../../src/core/defaults';

describe('Continuation Nudger', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    document.body.innerHTML = '';
  });

  it('nudges continuation when many cards are hidden and visible cards < 12', () => {
    const nudger = new ContinuationNudger();
    const scrollBySpy = vi.spyOn(window, 'scrollBy').mockImplementation(() => {});

    // Create 15 hidden cards and 2 visible cards
    for (let i = 0; i < 15; i++) {
      const card = document.createElement('div');
      card.setAttribute('data-yfc-state', 'hidden');
      container.appendChild(card);
    }
    for (let i = 0; i < 2; i++) {
      const card = document.createElement('div');
      card.setAttribute('data-yfc-state', 'shown');
      container.appendChild(card);
    }

    const nudged = nudger.checkAndNudge(container);
    expect(nudged).toBe(true);
    expect(scrollBySpy).toHaveBeenCalled();
  });

  it('caps nudges at max 5 per batch', () => {
    const nudger = new ContinuationNudger();
    vi.spyOn(window, 'scrollBy').mockImplementation(() => {});

    // Add hidden cards
    const card = document.createElement('div');
    card.setAttribute('data-yfc-state', 'hidden');
    container.appendChild(card);

    let count = 0;
    for (let i = 0; i < 10; i++) {
      // Advance time mock
      vi.spyOn(Date, 'now').mockReturnValue(1000 + i * 1000);
      if (nudger.checkAndNudge(container)) {
        count++;
      }
    }

    expect(count).toBe(5);
  });
});

describe('Empty Feed Banner', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    document.body.innerHTML = '';
  });

  it('displays empty feed banner and handles show unfiltered once', () => {
    const onShowUnfiltered = vi.fn();
    showEmptyFeedBanner(container, onShowUnfiltered);

    const banner = document.getElementById('yfc-empty-feed-banner');
    expect(banner).not.toBeNull();
    expect(banner?.textContent).toContain('All videos here were filtered');

    const unfilteredBtn = document.getElementById('yfc-btn-unfiltered-once');
    fireEvent.click(unfilteredBtn!);

    expect(onShowUnfiltered).toHaveBeenCalledTimes(1);
    expect(document.getElementById('yfc-empty-feed-banner')).toBeNull();
  });

  it('removes banner on removeEmptyFeedBanner()', () => {
    showEmptyFeedBanner(container, () => {});
    expect(document.getElementById('yfc-empty-feed-banner')).not.toBeNull();

    removeEmptyFeedBanner();
    expect(document.getElementById('yfc-empty-feed-banner')).toBeNull();
  });
});

describe('OnboardingModal', () => {
  it('renders and completes onboarding', () => {
    const handleComplete = vi.fn().mockImplementation((updater) => {
      const next = updater(DEFAULT_SETTINGS);
      expect(next.onboardingDone).toBe(true);
      return Promise.resolve();
    });

    render(<OnboardingModal settings={DEFAULT_SETTINGS} onComplete={handleComplete} />);

    expect(screen.getByTestId('onboarding-modal')).toBeInTheDocument();
    expect(screen.getByText(/Welcome to YouTube Feed Control/i)).toBeInTheDocument();

    const finishBtn = screen.getByTestId('onboarding-complete-btn');
    fireEvent.click(finishBtn);

    expect(handleComplete).toHaveBeenCalledTimes(1);
  });
});
