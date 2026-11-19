import { SurfaceId, SurfaceMode, Settings } from '../core/types';

export interface SurfaceInfo {
  id: SurfaceId;
  defaultMode: SurfaceMode;
  name: string;
}

export const SURFACE_REGISTRY: Record<SurfaceId, SurfaceInfo> = {
  home: { id: 'home', defaultMode: 'full', name: 'Home feed' },
  watch: { id: 'watch', defaultMode: 'full', name: 'Watch sidebar' },
  subscriptions: { id: 'subscriptions', defaultMode: 'full', name: 'Subscriptions feed' },
  explore: { id: 'explore', defaultMode: 'full', name: 'Explore & Trending' },
  channel: { id: 'channel', defaultMode: 'blacklistOnly', name: 'Channel & Playlists' },
  endscreen: { id: 'endscreen', defaultMode: 'full', name: 'End-screen suggestions' },
  search: { id: 'search', defaultMode: 'bypass', name: 'Search results' },
  library: { id: 'library', defaultMode: 'bypass', name: 'History & Library' }
};

export function detectSurface(urlStr: string = window.location.href): SurfaceId {
  try {
    const url = new URL(urlStr);
    const path = url.pathname;
    const search = url.search;

    // Search results: /results
    if (path.startsWith('/results')) {
      return 'search';
    }

    // Watch page: /watch
    if (path.startsWith('/watch')) {
      return 'watch';
    }

    // Subscriptions: /feed/subscriptions
    if (path.startsWith('/feed/subscriptions')) {
      return 'subscriptions';
    }

    // Explore / Trending: /feed/trending, /feed/explore
    if (path.startsWith('/feed/trending') || path.startsWith('/feed/explore')) {
      return 'explore';
    }

    // History, Library, Liked: /feed/history, /feed/library, /playlist?list=LL
    if (
      path.startsWith('/feed/history') ||
      path.startsWith('/feed/library') ||
      (path.startsWith('/playlist') && search.includes('list=LL'))
    ) {
      return 'library';
    }

    // Channel pages, playlist pages: /@..., /channel/..., /c/..., /user/..., /playlist
    if (
      path.startsWith('/@') ||
      path.startsWith('/channel/') ||
      path.startsWith('/c/') ||
      path.startsWith('/user/') ||
      path.startsWith('/playlist')
    ) {
      return 'channel';
    }

    // Home feed: /
    if (path === '/' || path === '') {
      return 'home';
    }

    // Default fallback
    return 'home';
  } catch (_e) {
    return 'home';
  }
}

export function getSurfaceMode(surfaceId: SurfaceId, settings: Settings): SurfaceMode {
  return settings.surfaces[surfaceId] || SURFACE_REGISTRY[surfaceId].defaultMode;
}

export class SurfaceSession {
  public surfaceId: SurfaceId;
  public sessionId: string;
  public startedAt: number;

  constructor(surfaceId: SurfaceId) {
    this.surfaceId = surfaceId;
    this.sessionId = `${surfaceId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.startedAt = Date.now();
  }
}

export type NavigationCallback = (newSession: SurfaceSession) => void;

let currentSession: SurfaceSession = new SurfaceSession(detectSurface());
const navigationCallbacks = new Set<NavigationCallback>();
let isInitialized = false;

export function getCurrentSession(): SurfaceSession {
  return currentSession;
}

export function initNavigationListener(): void {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  const triggerNavigation = () => {
    const newSurface = detectSurface();
    currentSession = new SurfaceSession(newSurface);
    navigationCallbacks.forEach((cb) => {
      try {
        cb(currentSession);
      } catch (err) {
        console.error('[YFC] Navigation callback error:', err);
      }
    });
  };

  // YouTube SPA event hooks
  window.addEventListener('yt-navigate-finish', triggerNavigation);
  window.addEventListener('yt-page-data-updated', triggerNavigation);
  window.addEventListener('popstate', triggerNavigation);

  // Hook history.pushState / replaceState for standard SPA changes
  const originalPush = history.pushState;
  history.pushState = function (...args) {
    const res = originalPush.apply(this, args);
    setTimeout(triggerNavigation, 0);
    return res;
  };

  const originalReplace = history.replaceState;
  history.replaceState = function (...args) {
    const res = originalReplace.apply(this, args);
    setTimeout(triggerNavigation, 0);
    return res;
  };
}

export function onSurfaceNavigation(callback: NavigationCallback): () => void {
  initNavigationListener();
  navigationCallbacks.add(callback);
  return () => {
    navigationCallbacks.delete(callback);
  };
}
