import { describe, it, expect, beforeEach } from 'vitest';
import { DiversitySessionState } from '../../src/core/pipeline/diversity/diversitySession';
import { evaluateDiversityStep } from '../../src/core/pipeline/diversity/diversityStep';
import { DEFAULT_SETTINGS } from '../../src/core/defaults';
import { VideoMeta, Classification, Settings } from '../../src/core/types';

describe('Diversity Engine', () => {
  let session: DiversitySessionState;
  const settings: Settings = {
    ...DEFAULT_SETTINGS,
    diversity: {
      maxPerChannel: 2,
      dedupe: true,
      maxImpressions: 2,
      windowHours: 24,
      subgenreWindow: { w: 12, k: 4 },
      hideWatched: true,
      watchedThresholdPct: 20
    }
  };

  const makeMeta = (id: string, channelId = 'ch1', watchedPct: number | null = null): VideoMeta => ({
    videoId: id,
    title: `Video ${id}`,
    channel: { channelId, name: `Channel ${channelId}` },
    durationSec: 600,
    isShort: false,
    isLive: false,
    isUpcoming: false,
    watchedPct
  });

  const makeClassification = (subgenreId = 'prog_web'): Classification => ({
    genreId: 'programming',
    subgenreId,
    contentTypes: ['tutorial'],
    confidence: 0.9,
    source: 'rules'
  });

  beforeEach(() => {
    session = new DiversitySessionState('home');
  });

  it('limits channel videos to max 2 in a surface session across multiple batches', async () => {
    // 1st video from ch1 -> pass
    const d1 = await evaluateDiversityStep(makeMeta('v1', 'ch1'), makeClassification(), settings, session);
    expect(d1).toBeNull(); // passed

    // 2nd video from ch1 -> pass
    const d2 = await evaluateDiversityStep(makeMeta('v2', 'ch1'), makeClassification(), settings, session);
    expect(d2).toBeNull(); // passed

    // 3rd video from ch1 -> hidden!
    const d3 = await evaluateDiversityStep(makeMeta('v3', 'ch1'), makeClassification(), settings, session);
    expect(d3?.action).toBe('hide');
    expect(d3?.reason).toBe('diversity_channel_cap');

    // Video from ch2 still passes!
    const d4 = await evaluateDiversityStep(makeMeta('v4', 'ch2'), makeClassification(), settings, session);
    expect(d4).toBeNull();
  });

  it('suppresses duplicate videoIds on the same surface session', async () => {
    const d1 = await evaluateDiversityStep(makeMeta('v10', 'ch1'), makeClassification(), settings, session);
    expect(d1).toBeNull();

    // Later card with same videoId
    const d2 = await evaluateDiversityStep(makeMeta('v10', 'ch1'), makeClassification(), settings, session);
    // Sticky check returns show for exact same accepted card if re-evaluated
    expect(d2?.action).toBe('show');

    // If rendered in session but not in accepted set
    const unacceptedSession = new DiversitySessionState('home');
    unacceptedSession.renderedVideoIds.add('v20');

    const d3 = await evaluateDiversityStep(makeMeta('v20', 'ch1'), makeClassification(), settings, unacceptedSession);
    expect(d3?.action).toBe('hide');
    expect(d3?.reason).toBe('diversity_duplicate');
  });

  it('hides already watched video when watchedPct >= threshold (20%)', async () => {
    const watchedMeta = makeMeta('v_watched', 'ch1', 35); // 35% watched
    const d = await evaluateDiversityStep(watchedMeta, makeClassification(), settings, session);
    expect(d?.action).toBe('hide');
    expect(d?.reason).toBe('diversity_watched');
  });

  it('suppresses subgenre repetition when exceeding K in sliding window W', async () => {
    // Fill window with 4 prog_web videos (k=4)
    for (let i = 1; i <= 4; i++) {
      await evaluateDiversityStep(
        makeMeta(`v_sg_${i}`, `ch_${i}`),
        makeClassification('prog_web'),
        settings,
        session
      );
    }

    // 5th video with prog_web should be hidden by subgenre window
    const d5 = await evaluateDiversityStep(
      makeMeta('v_sg_5', 'ch_5'),
      makeClassification('prog_web'),
      settings,
      session
    );
    expect(d5?.action).toBe('hide');
    expect(d5?.reason).toBe('diversity_subgenre_window');

    // A different subgenre passes!
    const dOther = await evaluateDiversityStep(
      makeMeta('v_sg_other', 'ch_6'),
      makeClassification('sci_physics'),
      settings,
      session
    );
    expect(dOther).toBeNull();
  });

  it('decisions are sticky: once accepted, card remains visible', async () => {
    const meta = makeMeta('v_sticky', 'ch1');
    await evaluateDiversityStep(meta, makeClassification(), settings, session);

    // Re-evaluating the same card in this session returns sticky allowed
    const reDec = await evaluateDiversityStep(meta, makeClassification(), settings, session);
    expect(reDec?.action).toBe('show');
    expect(reDec?.detail).toContain('sticky');
  });

  it('resets diversity state on navigation to a new surface session', async () => {
    await evaluateDiversityStep(makeMeta('v1', 'ch1'), makeClassification(), settings, session);
    await evaluateDiversityStep(makeMeta('v2', 'ch1'), makeClassification(), settings, session);

    // 3rd is hidden
    const d3 = await evaluateDiversityStep(makeMeta('v3', 'ch1'), makeClassification(), settings, session);
    expect(d3?.action).toBe('hide');

    // Reset session
    session.reset();

    // Now ch1 can appear again!
    const dAfterReset = await evaluateDiversityStep(makeMeta('v3', 'ch1'), makeClassification(), settings, session);
    expect(dAfterReset).toBeNull();
  });
});
