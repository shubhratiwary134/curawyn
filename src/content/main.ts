import { ContentObserver } from './observer';
import { ShortsBlocker } from './shorts';
import { ContinuationNudger } from './continuation';
import { showEmptyFeedBanner, removeEmptyFeedBanner } from './emptyBanner';
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
let continuationNudger = new ContinuationNudger();
let diversitySession = new DiversitySessionState(detectSurface());
let showUnfilteredOnceSession = false;

async function init() {
  currentSettings = await getSettings();

  const evaluator = async (meta: VideoMeta): Promise<Decision> => {
    if (!currentSettings) {
      return { action: 'show', reason: 'allowed' };
    }

    if (showUnfilteredOnceSession) {
      return { action: 'show', reason: 'allowed', detail: 'unfiltered_once' };
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
      recordImpression({
        videoId: meta.videoId,
        timestamp: Date.now(),
        subgenreId: classification.subgenreId,
        channelId: meta.channel?.channelId
      }).catch(() => {});
    }

    // Schedule check for continuation and empty banner after decision
    setTimeout(checkFeedState, 200);

    return decision;
  };

  observer = new ContentObserver(currentSettings, evaluator);
  observer.start();

  shortsBlocker = new ShortsBlocker(currentSettings);
  shortsBlocker.start();

  subscribeSettings((newSettings) => {
    currentSettings = newSettings;
    if (observer) {
      observer.updateSettings(newSettings);
    }
    if (shortsBlocker) {
      shortsBlocker.updateSettings(newSettings);
    }
  });

  onSurfaceNavigation((session) => {
    showUnfilteredOnceSession = false;
    continuationNudger.resetBatch();
    removeEmptyFeedBanner();
    diversitySession = new DiversitySessionState(session.surfaceId, session.sessionId);

    if (observer) {
      observer.resetSession();
    }
    if (shortsBlocker) {
      shortsBlocker.applyShortsBlocking(session.surfaceId);
    }
  });

  console.log('[YFC] Feed Control with continuation & empty banner active.');
}

function checkFeedState() {
  if (typeof document === 'undefined') return;

  const surface = detectSurface();
  if (surface === 'search' || surface === 'library') return;

  const cards = document.querySelectorAll('[data-yfc-state]');
  if (cards.length === 0) return;

  const visibleCards = document.querySelectorAll(
    '[data-yfc-state="shown"], [data-yfc-state="pending"]'
  );

  if (visibleCards.length === 0 && cards.length >= 3) {
    const feedContainer =
      document.querySelector('ytd-rich-grid-renderer #contents') ||
      document.querySelector('#contents') ||
      document.body;

    showEmptyFeedBanner(feedContainer as HTMLElement, () => {
      showUnfilteredOnceSession = true;
      if (observer) observer.resetSession();
    });
  } else {
    removeEmptyFeedBanner();
  }

  // Nudge continuation if visible cards count is low
  continuationNudger.checkAndNudge();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
