import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { evaluateExtractionHealth, resetHealth } from '../../src/content/health';
import { ContentObserver } from '../../src/content/observer';
import { evaluatePipeline } from '../../src/core/pipeline/pipeline';
import { DEFAULT_SETTINGS } from '../../src/core/defaults';
import { VideoMeta, Classification } from '../../src/core/types';

describe('Resilience & Health Check', () => {
  beforeEach(() => {
    resetHealth();
  });

  it('sets extractionBroken and fails open when >= 8 cards exist but 0 are parseable on full surface', () => {
    const health = evaluateExtractionHealth(10, 0, 'full');
    expect(health.extractionBroken).toBe(true);
    expect(health.totalCardsFound).toBe(10);
    expect(health.totalParsed).toBe(0);
  });

  it('does not trigger extractionBroken if surface is bypass or blacklistOnly', () => {
    const healthBypass = evaluateExtractionHealth(10, 0, 'bypass');
    expect(healthBypass.extractionBroken).toBe(false);

    const healthBlacklistOnly = evaluateExtractionHealth(10, 0, 'blacklistOnly');
    expect(healthBlacklistOnly.extractionBroken).toBe(false);
  });

  it('observer marks cards shown (fails open) when health check detects broken extraction', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    // Create 8 malformed cards without parseable title or link
    for (let i = 0; i < 8; i++) {
      const card = document.createElement('ytd-rich-item-renderer');
      card.innerHTML = '<div>Corrupted YouTube markup</div>';
      container.appendChild(card);
    }

    const observer = new ContentObserver({ ...DEFAULT_SETTINGS, onboardingDone: true });
    observer.start();

    await new Promise((r) => setTimeout(r, 60));

    const cards = container.querySelectorAll('ytd-rich-item-renderer');
    cards.forEach((c) => {
      expect(c.getAttribute('data-yfc-state')).toBe('shown');
      expect(c.getAttribute('data-yfc-reason')).toBe('allowed');
    });

    observer.stop();
    container.remove();
  });
});

describe('Performance Benchmark & Leak Prevention', () => {
  const meta: VideoMeta = {
    videoId: 'benchVid123',
    title: 'React 19 Architecture and TypeScript Deep Dive',
    channel: { channelId: 'chDev', name: 'Dev Channel' },
    durationSec: 900,
    isShort: false,
    isLive: false,
    isUpcoming: false,
    watchedPct: null
  };

  const classification: Classification = {
    genreId: 'programming',
    subgenreId: 'prog_web',
    contentTypes: ['tutorial', 'deep_dive'],
    confidence: 0.95,
    source: 'rules'
  };

  it('executes pipeline evaluation with median latency < 5 ms', async () => {
    const settings = { ...DEFAULT_SETTINGS, onboardingDone: true };
    const iterations = 100;
    const durations: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await evaluatePipeline(meta, classification, settings, 'home', 'full');
      const end = performance.now();
      durations.push(end - start);
    }

    durations.sort((a, b) => a - b);
    const median = durations[Math.floor(iterations / 2)];

    expect(median).toBeLessThan(5.0); // Strict requirement: < 5ms median
  });

  it('survives 50 simulated SPA navigations without observer leaks', () => {
    const observer = new ContentObserver(DEFAULT_SETTINGS);
    observer.start();

    for (let i = 0; i < 50; i++) {
      observer.resetSession();
      expect(observer.getActiveCards().length).toBe(0);
    }

    observer.stop();
  });
});
