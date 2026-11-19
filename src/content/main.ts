import { ContentObserver } from './observer';
import { getSettings, subscribeSettings } from '../platform/settingsStore';
import { detectSurface, getSurfaceMode, onSurfaceNavigation } from './surfaces';
import { classifyVideo } from '../core/classify/classifier';
import { evaluatePipeline } from '../core/pipeline/pipeline';
import { Settings, VideoMeta, Decision } from '../core/types';

let currentSettings: Settings | null = null;
let observer: ContentObserver | null = null;

async function init() {
  currentSettings = await getSettings();

  const evaluator = (meta: VideoMeta): Decision => {
    if (!currentSettings) {
      return { action: 'show', reason: 'allowed' };
    }
    const surface = detectSurface();
    const mode = getSurfaceMode(surface, currentSettings);
    const classification = classifyVideo(meta, currentSettings);
    return evaluatePipeline(meta, classification, currentSettings, surface, mode);
  };

  observer = new ContentObserver(currentSettings, evaluator);
  observer.start();

  // Settings subscription
  subscribeSettings((newSettings) => {
    currentSettings = newSettings;
    if (observer) {
      observer.updateSettings(newSettings);
    }
  });

  // SPA navigation hook
  onSurfaceNavigation(() => {
    if (observer) {
      observer.resetSession();
    }
  });

  console.log('[YFC] Pipeline initialized and observing feed.');
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
