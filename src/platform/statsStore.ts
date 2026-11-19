export interface ReasonStats {
  blacklist: number;
  shorts: number;
  whitelist: number;
  duration: number;
  contentType: number;
  diversity: number;
  unclassified: number;
  totalHidden: number;
  totalShown: number;
}

export const STATS_STORAGE_KEY = 'yfc_daily_stats';

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getDefaultStats(): ReasonStats {
  return {
    blacklist: 0,
    shorts: 0,
    whitelist: 0,
    duration: 0,
    contentType: 0,
    diversity: 0,
    unclassified: 0,
    totalHidden: 0,
    totalShown: 0
  };
}

export async function getTodayStats(): Promise<ReasonStats> {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    return getDefaultStats();
  }

  return new Promise((resolve) => {
    const today = getTodayKey();
    chrome.storage.local.get([STATS_STORAGE_KEY], (res) => {
      const data = res ? res[STATS_STORAGE_KEY] : null;
      if (data && data.date === today && data.stats) {
        resolve(data.stats);
      } else {
        resolve(getDefaultStats());
      }
    });
  });
}

export async function incrementStat(
  reasonCategory: keyof Omit<ReasonStats, 'totalHidden' | 'totalShown'>
): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    return;
  }

  const today = getTodayKey();
  const current = await getTodayStats();
  current[reasonCategory]++;
  current.totalHidden++;

  chrome.storage.local.set({
    [STATS_STORAGE_KEY]: {
      date: today,
      stats: current
    }
  });
}
