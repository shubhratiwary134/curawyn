import { describe, it, expect } from 'vitest';
import { evaluatePipeline } from '../../src/core/pipeline/pipeline';
import { DEFAULT_SETTINGS } from '../../src/core/defaults';
import { VideoMeta, Classification, Settings } from '../../src/core/types';

describe('Filter Pipeline Precedence Matrix', () => {
  const activeSettings: Settings = {
    ...DEFAULT_SETTINGS,
    onboardingDone: true, // Enable filtering
    enabled: true
  };

  const sampleMeta: VideoMeta = {
    videoId: 'vid123',
    title: 'Clean Code React Tutorial',
    channel: { channelId: 'ch1', name: 'Dev Channel' },
    durationSec: 600, // 10 min
    isShort: false,
    isLive: false,
    isUpcoming: false,
    watchedPct: null
  };

  const sampleClassification: Classification = {
    genreId: 'programming',
    subgenreId: 'prog_web',
    contentTypes: ['tutorial'],
    confidence: 0.95,
    source: 'rules'
  };

  it('allows matching video on full surface when all filters pass', () => {
    const decision = evaluatePipeline(sampleMeta, sampleClassification, activeSettings, 'home', 'full');
    expect(decision.action).toBe('show');
    expect(decision.reason).toBe('allowed');
  });

  // PRECEDENCE 1: Blacklist wins over Whitelist
  it('Step 1 (Blacklist) beats Whitelist: blacklisted channel inside whitelisted genre is hidden', () => {
    const settings: Settings = {
      ...activeSettings,
      blacklist: {
        ...activeSettings.blacklist,
        channels: {
          ch1: { channelId: 'ch1', name: 'Dev Channel', addedAt: Date.now() }
        }
      }
    };

    const decision = evaluatePipeline(sampleMeta, sampleClassification, settings, 'home', 'full');
    expect(decision.action).toBe('hide');
    expect(decision.reason).toBe('blacklist_channel');
  });

  // PRECEDENCE 1 vs 2: Blacklist beats Shorts blocker
  it('Step 1 (Blacklist) beats Step 2 (Shorts blocker) on blacklisted short', () => {
    const shortMeta: VideoMeta = {
      ...sampleMeta,
      isShort: true
    };
    const settings: Settings = {
      ...activeSettings,
      blacklist: {
        ...activeSettings.blacklist,
        videos: {
          vid123: { title: 'Short Vid', addedAt: Date.now() }
        }
      }
    };

    const decision = evaluatePipeline(shortMeta, sampleClassification, settings, 'home', 'full');
    expect(decision.action).toBe('hide');
    expect(decision.reason).toBe('blacklist_video'); // Step 1 decisive result
  });

  // PRECEDENCE 2: Shorts blocker beats Whitelist
  it('Step 2 (Shorts blocker) beats Whitelist: short in whitelisted genre is blocked', () => {
    const shortMeta: VideoMeta = {
      ...sampleMeta,
      isShort: true
    };
    const decision = evaluatePipeline(shortMeta, sampleClassification, activeSettings, 'home', 'full');
    expect(decision.action).toBe('hide');
    expect(decision.reason).toBe('shorts_blocked');
  });

  // PRECEDENCE 3: Live streams blocked
  it('Step 3 (Live policy): blocks live stream when liveStreams = block', () => {
    const liveMeta: VideoMeta = {
      ...sampleMeta,
      isLive: true,
      durationSec: null
    };
    const settings: Settings = {
      ...activeSettings,
      global: {
        ...activeSettings.global,
        liveStreams: 'block'
      }
    };

    const decision = evaluatePipeline(liveMeta, sampleClassification, settings, 'home', 'full');
    expect(decision.action).toBe('hide');
    expect(decision.reason).toBe('live_blocked');
  });

  // PRECEDENCE 3: Live streams allowed skip duration
  it('Step 3 (Live policy): allowed live stream skips duration rules', () => {
    const liveMeta: VideoMeta = {
      ...sampleMeta,
      isLive: true,
      durationSec: null // would fail duration rule if evaluated
    };
    const decision = evaluatePipeline(liveMeta, sampleClassification, activeSettings, 'home', 'full');
    expect(decision.action).toBe('show');
    expect(decision.reason).toBe('allowed');
  });

  // PRECEDENCE 4: Whitelist beats Duration
  it('Step 4 (Whitelist) beats Step 5 (Duration): video in disabled genre is hidden by genre_disabled', () => {
    const settings: Settings = {
      ...activeSettings,
      genres: {
        ...activeSettings.genres,
        programming: {
          ...activeSettings.genres['programming'],
          enabled: false
        }
      }
    };
    const tooShortMeta: VideoMeta = {
      ...sampleMeta,
      durationSec: 60 // 1 min (violates 5 min minSec)
    };

    const decision = evaluatePipeline(tooShortMeta, sampleClassification, settings, 'home', 'full');
    expect(decision.action).toBe('hide');
    expect(decision.reason).toBe('genre_disabled'); // step 4 wins over step 5
  });

  // PRECEDENCE 5: Duration limit
  it('Step 5 (Duration): hides video exceeding maxSec', () => {
    const tooLongMeta: VideoMeta = {
      ...sampleMeta,
      durationSec: 4000 // exceeds 3600s
    };
    const decision = evaluatePipeline(tooLongMeta, sampleClassification, activeSettings, 'home', 'full');
    expect(decision.action).toBe('hide');
    expect(decision.reason).toBe('duration_limit');
  });

  // PRECEDENCE 6: Content type disallowed
  it('Step 6 (Content Type): hides video with disallowed content type', () => {
    const settings: Settings = {
      ...activeSettings,
      global: {
        ...activeSettings.global,
        contentTypes: ['documentary'] // tutorial not allowed
      }
    };
    const decision = evaluatePipeline(sampleMeta, sampleClassification, settings, 'home', 'full');
    expect(decision.action).toBe('hide');
    expect(decision.reason).toBe('content_type_disallowed');
  });

  // SURFACE MODES:
  it('bypasses filtering on search surface', () => {
    const disabledGenreSettings: Settings = {
      ...activeSettings,
      genres: {
        ...activeSettings.genres,
        programming: {
          ...activeSettings.genres['programming'],
          enabled: false
        }
      }
    };
    const decision = evaluatePipeline(sampleMeta, sampleClassification, disabledGenreSettings, 'search', 'bypass');
    expect(decision.action).toBe('show');
    expect(decision.reason).toBe('allowed');
  });

  it('runs only blacklist on blacklistOnly surface (e.g. channel page)', () => {
    const disabledGenreSettings: Settings = {
      ...activeSettings,
      genres: {
        ...activeSettings.genres,
        programming: {
          ...activeSettings.genres['programming'],
          enabled: false
        }
      }
    };
    // Disabled genre does NOT block on blacklistOnly
    const decAllowed = evaluatePipeline(sampleMeta, sampleClassification, disabledGenreSettings, 'channel', 'blacklistOnly');
    expect(decAllowed.action).toBe('show');

    // But blacklisted channel DOES block on blacklistOnly
    const blacklistedSettings: Settings = {
      ...disabledGenreSettings,
      blacklist: {
        ...disabledGenreSettings.blacklist,
        channels: {
          ch1: { channelId: 'ch1', name: 'Dev Channel', addedAt: Date.now() }
        }
      }
    };
    const decBlocked = evaluatePipeline(sampleMeta, sampleClassification, blacklistedSettings, 'channel', 'blacklistOnly');
    expect(decBlocked.action).toBe('hide');
    expect(decBlocked.reason).toBe('blacklist_channel');
  });

  // PASSTHROUGH MODE:
  it('returns passthrough when onboarding is not done', () => {
    const unboarded: Settings = {
      ...activeSettings,
      onboardingDone: false
    };
    const decision = evaluatePipeline(sampleMeta, sampleClassification, unboarded, 'home', 'full');
    expect(decision.action).toBe('show');
    expect(decision.reason).toBe('passthrough');
  });
});
