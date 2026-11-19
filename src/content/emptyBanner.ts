export function showEmptyFeedBanner(
  container: HTMLElement,
  onShowUnfilteredOnce: () => void
): void {
  if (document.getElementById('yfc-empty-feed-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'yfc-empty-feed-banner';
  banner.style.margin = '20px auto';
  banner.style.maxWidth = '600px';
  banner.style.padding = '16px 20px';
  banner.style.backgroundColor = '#1e1e1e';
  banner.style.border = '1px solid #333';
  banner.style.borderRadius = '8px';
  banner.style.color = '#fff';
  banner.style.textAlign = 'center';
  banner.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)';
  banner.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  banner.innerHTML = `
    <div style="font-size: 20px; margin-bottom: 6px;">🎯 All videos here were filtered</div>
    <p style="color: #aaa; font-size: 13px; margin: 0 0 14px 0;">
      None of the loaded recommendations matched your active genre/duration whitelist.
    </p>
    <div style="display: flex; gap: 10px; justify-content: center;">
      <button id="yfc-btn-open-options" style="padding: 8px 16px; background-color: #065fd4; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">
        Adjust Filters
      </button>
      <button id="yfc-btn-unfiltered-once" style="padding: 8px 16px; background-color: #333; color: #ccc; border: 1px solid #444; border-radius: 4px; cursor: pointer; font-size: 13px;">
        Show Unfiltered Once
      </button>
    </div>
  `;

  container.prepend(banner);

  document.getElementById('yfc-btn-open-options')?.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'), '_blank');
    }
  });

  document.getElementById('yfc-btn-unfiltered-once')?.addEventListener('click', () => {
    banner.remove();
    onShowUnfilteredOnce();
  });
}

export function removeEmptyFeedBanner(): void {
  const banner = document.getElementById('yfc-empty-feed-banner');
  if (banner) banner.remove();
}
