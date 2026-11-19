import { VideoMeta, Settings, ContentTypeId } from '../../core/types';
import { patchSettings } from '../../platform/settingsStore';
import { ALL_CONTENT_TYPES } from '../../core/defaults';
import { CONTENT_TYPE_REGISTRY } from '../../core/taxonomy/contentTypes';

export function openCorrectionModal(
  meta: VideoMeta,
  settings: Settings,
  onApplied: () => void
): void {
  const existing = document.getElementById('yfc-correction-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'yfc-correction-modal';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100vw';
  modal.style.height = '100vh';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
  modal.style.zIndex = '2147483647';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  const subgenres = Object.values(settings.subgenres).sort((a, b) => a.order - b.order);
  const defaultSubgenre = subgenres[0]?.id || '';

  modal.innerHTML = `
    <div style="background-color: #1f1f1f; border: 1px solid #333; border-radius: 8px; max-width: 500px; width: 100%; padding: 24px; color: #fff; box-shadow: 0 8px 32px rgba(0,0,0,0.6);">
      <h3 style="margin: 0 0 8px 0; font-size: 18px;">Correct Genre / Type Classification</h3>
      <p style="color: #aaa; font-size: 13px; margin: 0 0 16px 0;">
        Teach the extension how to classify "${meta.title.slice(0, 45)}...". Overrides take immediate 100% priority.
      </p>

      <div style="margin-bottom: 14px;">
        <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 6px;">
          Target Subgenre:
        </label>
        <select id="yfc-correction-subgenre" style="width: 100%; padding: 8px; background-color: #141414; color: #fff; border: 1px solid #444; border-radius: 4px;">
          ${subgenres
            .map(
              (s) =>
                `<option value="${s.id}">${settings.genres[s.genreId]?.name || ''} → ${s.name}</option>`
            )
            .join('')}
        </select>
      </div>

      <div style="margin-bottom: 16px;">
        <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 6px;">
          Content Types:
        </label>
        <div id="yfc-correction-types" style="display: flex; flex-wrap: wrap; gap: 6px; max-height: 120px; overflow-y: auto;">
          ${ALL_CONTENT_TYPES.map(
            (t) =>
              `<label style="padding: 4px 8px; background: #292929; border: 1px solid #444; border-radius: 12px; font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                <input type="checkbox" value="${t}" ${t === 'tutorial' ? 'checked' : ''}/>
                ${CONTENT_TYPE_REGISTRY[t].label}
              </label>`
          ).join('')}
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
          <input type="radio" name="yfc-scope" value="video" checked id="yfc-scope-video"/>
          <span>Apply to this video only</span>
        </label>
        ${
          meta.channel
            ? `<label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; margin-top: 6px;">
                <input type="radio" name="yfc-scope" value="channel" id="yfc-scope-channel"/>
                <span>Apply to entire channel ("${meta.channel.name}")</span>
              </label>`
            : ''
        }
      </div>

      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="yfc-correction-cancel" style="padding: 8px 16px; background-color: #333; color: #ccc; border: none; border-radius: 4px; cursor: pointer;">
          Cancel
        </button>
        <button id="yfc-correction-save" style="padding: 8px 18px; background-color: #065fd4; color: #fff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">
          Save Override
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('yfc-correction-cancel')?.addEventListener('click', () => {
    modal.remove();
  });

  document.getElementById('yfc-correction-save')?.addEventListener('click', async () => {
    const subgenreSelect = document.getElementById('yfc-correction-subgenre') as HTMLSelectElement;
    const subgenreId = subgenreSelect?.value || defaultSubgenre;

    const checkedBoxes = modal.querySelectorAll('#yfc-correction-types input[type="checkbox"]:checked');
    const contentTypes: ContentTypeId[] = [];
    checkedBoxes.forEach((cb) => {
      contentTypes.push((cb as HTMLInputElement).value as ContentTypeId);
    });

    const isChannelScope = (document.getElementById('yfc-scope-channel') as HTMLInputElement)?.checked;

    if (isChannelScope && meta.channel) {
      const channelKey = meta.channel.channelId || meta.channel.handle || meta.channel.name;
      await patchSettings((prev) => ({
        ...prev,
        overrides: {
          ...prev.overrides,
          channels: {
            ...prev.overrides.channels,
            [channelKey]: { subgenreId, contentTypes }
          }
        }
      }));
    } else {
      await patchSettings((prev) => ({
        ...prev,
        overrides: {
          ...prev.overrides,
          videos: {
            ...prev.overrides.videos,
            [meta.videoId]: { subgenreId, contentTypes }
          }
        }
      }));
    }

    modal.remove();
    onApplied();
  });
}
