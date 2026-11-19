import { ContentObserver } from './observer';
import { ShortsBlocker } from './shorts';
import { getSettings, subscribeSettings } from '../platform/settingsStore';
import { detectSurface, getSurfaceMode, onSurfaceNavigation } from './surfaces';
import { classifyVideo } from '../core/classify/classifier';
import { evaluatePipeline } from '../core/pipeline/pipeline';
import { DiversitySessionState } from '../core/pipeline/diversity/diversitySession';
import {
  getImpressionsCountInWindow,
  recordImpression,
  isVideoSeen
} from '../platform/cacheDb';
import { Settings, VideoMeta, Decision } from '../core/types';

let currentSettings: Settings | null = null;
let observer: ContentObserver | null = null;
let shortsBlocker: ShortsBlocker | null = null;
let diversitySession = new DiversitySessionState(detectSurface());

async function init() {
  currentSettings = await getSettings();

  const evaluator = async (meta: VideoMeta): Promise<Decision> => {
    if (!currentSettings) {
      return { action: 'show', reason: 'allowed' };
    }
    const surface = detectSurface();
    const mode = getSurfaceMode(surface, currentSettings);
    const classification = classifyVideo(meta, currentSettings);

    const decision = await evaluatePipeline(
      meta,
      classification,
      currentSettings,
      surface,
      mode,
      diversitySession,
      getImpressionsCountInWindow,
      isVideoSeen
    );

    if (decision.action === 'show' && decision.reason === 'allowed') {
      // Record impression once card passes all filters and is rendered
      recordImpression({
        videoId: meta.videoId,
        timestamp: Date.now(),
        subgenreId: classification.subgenreId,
        channelId: meta.channel?.channelId
      }).catch(() => {});
    }

    return decision;
  };

  observer = new ContentObserver(currentSettings, evaluator);
  observer.start();

  shortsBlocker = new ShortsBlocker(currentSettings);
  shortsBlocker.start();

  // Settings subscription
  subscribeSettings((newSettings) => {
    currentSettings = newSettings;
    if (observer) {
      observer.updateSettings(newSettings);
    }
    if (shortsBlocker) {
      shortsBlocker.updateSettings(newSettings);
    }
  });

  // SPA navigation hook: resets surface session and diversity state
  onSurfaceNavigation((session) => {
    diversitySession = new DiversitySessionState(session.surfaceId, session.sessionId);
    if (observer) {
      observer.resetSession();
    }
    if (shortsBlocker) {
      shortsBlocker.applyShortsBlocking(session.surfaceId);
    }
  });

  console.log('[YFC] Pipeline with Diversity Engine initialized.');
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
