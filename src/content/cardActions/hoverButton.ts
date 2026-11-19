import { VideoMeta, Settings, Classification } from '../../core/types';
import { patchSettings } from '../../platform/settingsStore';

export function showUndoToast(message: string, onUndo: () => Promise<void>): void {
  const existing = document.getElementById('yfc-undo-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'yfc-undo-toast';
  toast.style.position = 'fixed';
  toast.style.bottom = '24px';
  toast.style.left = '24px';
  toast.style.backgroundColor = '#222';
  toast.style.color = '#fff';
  toast.style.border = '1px solid #444';
  toast.style.borderRadius = '6px';
  toast.style.padding = '10px 16px';
  toast.style.zIndex = '2147483647';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '12px';
  toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
  toast.style.fontFamily = 'Roboto, sans-serif';
  toast.style.fontSize = '13px';

  toast.innerHTML = `
    <span>${message}</span>
    <button id="yfc-toast-undo-btn" style="background-color: #065fd4; color: #fff; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 12px;">
      Undo
    </button>
  `;

  document.body.appendChild(toast);

  let undone = false;
  const timeoutId = setTimeout(() => {
    if (!undone && toast.parentElement) {
      toast.remove();
    }
  }, 6000); // 6 second toast

  document.getElementById('yfc-toast-undo-btn')?.addEventListener('click', async () => {
    undone = true;
    clearTimeout(timeoutId);
    toast.remove();
    await onUndo();
  });
}

export function injectCardHoverButton(
  cardEl: HTMLElement,
  meta: VideoMeta,
  classification: Classification | null,
  _settings: Settings,
  onOpenCorrection: (meta: VideoMeta) => void
): void {
  if (cardEl.querySelector('.yfc-card-action-host')) return;

  const host = document.createElement('div');
  host.className = 'yfc-card-action-host';
  host.style.position = 'absolute';
  host.style.top = '6px';
  host.style.right = '6px';
  host.style.zIndex = '1000';

  const shadow = host.attachShadow({ mode: 'open' });
  const container = document.createElement('div');
  container.className = 'yfc-action-container';

  const style = document.createElement('style');
  style.textContent = `
    .yfc-btn {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 14px;
      opacity: 0;
      transition: opacity 0.2s, background 0.2s;
    }
    :host(:hover) .yfc-btn, .yfc-btn.active {
      opacity: 1;
    }
    .yfc-btn:hover {
      background: #065fd4;
    }
    .yfc-menu {
      display: none;
      position: absolute;
      top: 30px;
      right: 0;
      background: #212121;
      border: 1px solid #383838;
      border-radius: 6px;
      min-width: 170px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.6);
      padding: 6px 0;
      font-family: Roboto, sans-serif;
      font-size: 13px;
    }
    .yfc-menu.open {
      display: block;
    }
    .yfc-item {
      padding: 8px 14px;
      color: #eee;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .yfc-item:hover {
      background: #333;
    }
    .yfc-danger {
      color: #ff6666;
    }
    .yfc-divider {
      height: 1px;
      background: #383838;
      margin: 4px 0;
    }
  `;

  shadow.appendChild(style);
  shadow.appendChild(container);

  container.innerHTML = `
    <button class="yfc-btn" title="Feed Control Actions">⋮</button>
    <div class="yfc-menu">
      <div class="yfc-item yfc-danger" data-action="block-video">🚫 Block Video</div>
      <div class="yfc-item yfc-danger" data-action="block-channel">🚫 Block Channel</div>
      ${classification?.subgenreId ? '<div class="yfc-item yfc-danger" data-action="block-subgenre">🚫 Block Subgenre</div>' : ''}
      <div class="yfc-divider"></div>
      <div class="yfc-item" data-action="wrong-genre">✏️ Wrong genre?</div>
    </div>
  `;

  const btn = container.querySelector('.yfc-btn') as HTMLButtonElement;
  const menu = container.querySelector('.yfc-menu') as HTMLDivElement;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    menu.classList.toggle('open');
    btn.classList.toggle('active', menu.classList.contains('open'));
  });

  document.addEventListener('click', () => {
    menu.classList.remove('open');
    btn.classList.remove('active');
  });

  // Action handlers
  menu.querySelector('[data-action="block-video"]')?.addEventListener('click', async (e) => {
    e.stopPropagation();
    menu.classList.remove('open');
    cardEl.style.display = 'none';

    await patchSettings((prev) => ({
      ...prev,
      blacklist: {
        ...prev.blacklist,
        videos: {
          ...prev.blacklist.videos,
          [meta.videoId]: { title: meta.title, addedAt: Date.now() }
        }
      }
    }));

    showUndoToast(`Blocked video "${meta.title.slice(0, 30)}..."`, async () => {
      await patchSettings((prev) => {
        const nextV = { ...prev.blacklist.videos };
        delete nextV[meta.videoId];
        return {
          ...prev,
          blacklist: { ...prev.blacklist, videos: nextV }
        };
      });
      cardEl.style.display = '';
    });
  });

  menu.querySelector('[data-action="block-channel"]')?.addEventListener('click', async (e) => {
    e.stopPropagation();
    menu.classList.remove('open');
    if (!meta.channel) return;

    const chRef = meta.channel;
    const chKey = chRef.channelId || chRef.handle || chRef.name;
    cardEl.style.display = 'none';

    await patchSettings((prev) => ({
      ...prev,
      blacklist: {
        ...prev.blacklist,
        channels: {
          ...prev.blacklist.channels,
          [chKey]: { ...chRef, addedAt: Date.now() }
        }
      }
    }));

    showUndoToast(`Blocked channel "${chRef.name}"`, async () => {
      await patchSettings((prev) => {
        const nextC = { ...prev.blacklist.channels };
        delete nextC[chKey];
        return {
          ...prev,
          blacklist: { ...prev.blacklist, channels: nextC }
        };
      });
      cardEl.style.display = '';
    });
  });

  menu.querySelector('[data-action="block-subgenre"]')?.addEventListener('click', async (e) => {
    e.stopPropagation();
    menu.classList.remove('open');
    if (!classification?.subgenreId) return;

    const subId = classification.subgenreId;
    cardEl.style.display = 'none';

    await patchSettings((prev) => {
      const sub = prev.subgenres[subId];
      if (!sub) return prev;
      return {
        ...prev,
        subgenres: {
          ...prev.subgenres,
          [subId]: { ...sub, blocked: true }
        }
      };
    });

    showUndoToast(`Blocked subgenre "${classification.subgenreId}"`, async () => {
      await patchSettings((prev) => {
        const sub = prev.subgenres[subId];
        if (!sub) return prev;
        return {
          ...prev,
          subgenres: {
            ...prev.subgenres,
            [subId]: { ...sub, blocked: false }
          }
        };
      });
      cardEl.style.display = '';
    });
  });

  menu.querySelector('[data-action="wrong-genre"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.remove('open');
    onOpenCorrection(meta);
  });

  cardEl.style.position = 'relative';
  cardEl.appendChild(host);
}
