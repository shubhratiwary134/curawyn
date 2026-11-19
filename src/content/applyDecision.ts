import { Decision, VideoMeta, Classification } from '../core/types';

export function applyDecision(
  cardEl: HTMLElement,
  decision: Decision,
  meta: VideoMeta | null,
  classification: Classification | null,
  debug: boolean
): void {
  // 1. Set DOM attributes for state machine
  cardEl.setAttribute('data-yfc-state', decision.action === 'show' ? 'shown' : 'hidden');
  cardEl.setAttribute('data-yfc-reason', decision.reason);
  if (decision.detail) {
    cardEl.setAttribute('data-yfc-detail', decision.detail);
  }

  // 2. Debug visual overlay
  if (debug) {
    applyDebugOverlay(cardEl, decision, meta, classification);
  } else {
    removeDebugOverlay(cardEl);
  }
}

export function applyDebugOverlay(
  cardEl: HTMLElement,
  decision: Decision,
  meta: VideoMeta | null,
  classification: Classification | null
): void {
  cardEl.style.outline = decision.action === 'show' ? '2px solid #2ecc71' : '2px solid #e74c3c';
  cardEl.style.position = 'relative';

  let overlay = cardEl.querySelector('.yfc-debug-overlay') as HTMLElement | null;
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'yfc-debug-overlay';
    cardEl.appendChild(overlay);
  }

  overlay.style.position = 'absolute';
  overlay.style.top = '4px';
  overlay.style.left = '4px';
  overlay.style.zIndex = '9999';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
  overlay.style.color = decision.action === 'show' ? '#2ecc71' : '#e74c3c';
  overlay.style.padding = '4px 8px';
  overlay.style.borderRadius = '4px';
  overlay.style.fontSize = '11px';
  overlay.style.fontFamily = 'monospace';
  overlay.style.pointerEvents = 'none';
  overlay.style.lineHeight = '1.3';

  const sub = classification?.subgenreId || 'none';
  const conf = classification ? `${Math.round(classification.confidence * 100)}%` : '0%';
  const types = classification?.contentTypes?.length ? classification.contentTypes.join(',') : 'none';
  const dur = meta?.durationSec ? `${meta.durationSec}s` : 'n/a';

  overlay.textContent = `[${decision.action.toUpperCase()}] ${decision.reason} | Sub: ${sub} (${conf}) | Types: ${types} | Dur: ${dur}`;
}

export function removeDebugOverlay(cardEl: HTMLElement): void {
  cardEl.style.outline = '';
  const overlay = cardEl.querySelector('.yfc-debug-overlay');
  if (overlay) {
    overlay.remove();
  }
}
