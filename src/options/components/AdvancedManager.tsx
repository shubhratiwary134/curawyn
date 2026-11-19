import React, { useState } from 'react';
import { Settings, SurfaceId, SurfaceMode } from '../../core/types';
import { SettingsSchema } from '../../core/schema';
import { SURFACE_REGISTRY } from '../../content/surfaces';
import { DEFAULT_SETTINGS } from '../../core/defaults';

interface Props {
  settings: Settings;
  onUpdateSettings: (updater: (prev: Settings) => Settings) => Promise<void>;
}

export const AdvancedManager: React.FC<Props> = ({ settings, onUpdateSettings }) => {
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [permStatus, setPermStatus] = useState<string | null>(null);

  const handleSurfaceModeChange = async (surfaceId: SurfaceId, mode: SurfaceMode) => {
    await onUpdateSettings((prev) => ({
      ...prev,
      surfaces: {
        ...prev.surfaces,
        [surfaceId]: mode
      }
    }));
  };

  const handleRequestDataApiPermission = async () => {
    if (typeof chrome === 'undefined' || !chrome.permissions) {
      setPermStatus('Chrome permissions API not available in this environment');
      return;
    }

    try {
      chrome.permissions.request(
        {
          origins: ['https://www.googleapis.com/*']
        },
        (granted) => {
          if (granted) {
            setPermStatus('Host permission granted for https://www.googleapis.com/*');
          } else {
            setPermStatus('Permission was denied by user.');
          }
        }
      );
    } catch (err) {
      setPermStatus(String(err));
    }
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'youtube-feed-control-settings.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(null);

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsedJson = JSON.parse(text);

        const validation = SettingsSchema.safeParse(parsedJson);
        if (!validation.success) {
          const issueMsg = validation.error.issues
            .map((iss) => `${iss.path.join('.')}: ${iss.message}`)
            .slice(0, 5)
            .join(' | ');
          setImportError(`Invalid settings JSON schema: ${issueMsg}`);
          return;
        }

        await onUpdateSettings(() => validation.data as Settings);
        setImportSuccess('Settings imported and applied successfully!');
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleResetEverything = async () => {
    if (
      window.confirm(
        'Are you sure you want to completely RESET ALL settings, filters, and blacklists to factory defaults?'
      )
    ) {
      await onUpdateSettings(() => ({ ...DEFAULT_SETTINGS }));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ margin: '0 0 6px 0' }}>Advanced Settings & Surface Modes</h2>
        <p style={{ margin: 0, color: '#aaa', fontSize: '14px' }}>
          Configure surface policies, classification strictness, optional API enrichment, and
          backup/restore.
        </p>
      </div>

      {/* 1. Surface Modes Registry */}
      <div
        data-testid="advanced-surfaces-card"
        style={{
          backgroundColor: '#181818',
          border: '1px solid #2e2e2e',
          borderRadius: '8px',
          padding: '20px'
        }}
      >
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Surface Filtering Modes</h3>
        <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#888' }}>
          <strong>full</strong> = entire whitelist & duration pipeline; <strong>blacklistOnly</strong> = only hard exclusions; <strong>bypass</strong> = unfiltered.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {(Object.keys(SURFACE_REGISTRY) as SurfaceId[]).map((sId) => {
            const surface = SURFACE_REGISTRY[sId];
            const currentMode = settings.surfaces[sId] || surface.defaultMode;

            return (
              <div
                key={sId}
                style={{
                  backgroundColor: '#202020',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{surface.name}</div>
                  <div style={{ fontSize: '11px', color: '#777' }}>ID: {sId}</div>
                </div>

                <select
                  data-testid={`surface-mode-select-${sId}`}
                  value={currentMode}
                  onChange={(e) => handleSurfaceModeChange(sId, e.target.value as SurfaceMode)}
                  style={{
                    backgroundColor: '#161616',
                    color: '#fff',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '12px'
                  }}
                >
                  <option value="full">Full</option>
                  <option value="blacklistOnly">Blacklist Only</option>
                  <option value="bypass">Bypass</option>
                </select>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Unclassified Policy & Confidence Threshold */}
      <div
        style={{
          backgroundColor: '#181818',
          border: '1px solid #2e2e2e',
          borderRadius: '8px',
          padding: '20px'
        }}
      >
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Unclassified Videos & Confidence</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', marginBottom: '6px' }}>
              Unclassified Video Policy:
            </label>
            <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
              <label style={{ cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="unclassified-policy"
                  data-testid="policy-hide"
                  checked={settings.unclassified.policy === 'hide'}
                  onChange={async () => {
                    await onUpdateSettings((prev) => ({
                      ...prev,
                      unclassified: { ...prev.unclassified, policy: 'hide' }
                    }));
                  }}
                />{' '}
                <strong>Hide</strong> (Strict mode: only allow videos with confident whitelist match)
              </label>

              <label style={{ cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="unclassified-policy"
                  data-testid="policy-show"
                  checked={settings.unclassified.policy === 'show'}
                  onChange={async () => {
                    await onUpdateSettings((prev) => ({
                      ...prev,
                      unclassified: { ...prev.unclassified, policy: 'show' }
                    }));
                  }}
                />{' '}
                <strong>Show</strong> (Permissive: allow unclassified videos to appear)
              </label>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>
              Confidence Threshold ({Math.round(settings.unclassified.confidenceThreshold * 100)}%)
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              data-testid="confidence-threshold-slider"
              value={settings.unclassified.confidenceThreshold}
              onChange={async (e) => {
                const val = parseFloat(e.target.value);
                await onUpdateSettings((prev) => ({
                  ...prev,
                  unclassified: { ...prev.unclassified, confidenceThreshold: val }
                }));
              }}
              style={{ width: '240px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', marginBottom: '6px' }}>
              Live Streams & Premieres Policy:
            </label>
            <select
              value={settings.global.liveStreams}
              data-testid="live-streams-select"
              onChange={async (e) => {
                const val = e.target.value as 'allow' | 'block';
                await onUpdateSettings((prev) => ({
                  ...prev,
                  global: { ...prev.global, liveStreams: val }
                }));
              }}
              style={{
                backgroundColor: '#222',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: '4px',
                padding: '6px 10px',
                fontSize: '13px'
              }}
            >
              <option value="allow">Allow live streams (skip duration limits)</option>
              <option value="block">Block all live streams & premieres</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Enrichment & Optional API Key */}
      <div
        style={{
          backgroundColor: '#181818',
          border: '1px solid #2e2e2e',
          borderRadius: '8px',
          padding: '20px'
        }}
      >
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Metadata Enrichment</h3>
        <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#888' }}>
          Fetch watch-page player metadata to boost keyword classification accuracy.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
            <input
              type="checkbox"
              checked={settings.enrichment.watchPageFetch}
              onChange={async (e) => {
                await onUpdateSettings((prev) => ({
                  ...prev,
                  enrichment: { ...prev.enrichment, watchPageFetch: e.target.checked }
                }));
              }}
            />
            <span>Enable Watch-Page Microformat Enrichment (same-origin, rate-limited)</span>
          </label>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
              Optional YouTube Data API v3 Key:
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={settings.enrichment.dataApiKey || ''}
                onChange={async (e) => {
                  const val = e.target.value.trim() || null;
                  await onUpdateSettings((prev) => ({
                    ...prev,
                    enrichment: { ...prev.enrichment, dataApiKey: val }
                  }));
                }}
                style={{
                  width: '320px',
                  padding: '6px 10px',
                  backgroundColor: '#222',
                  color: '#fff',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  fontSize: '13px'
                }}
              />
              <button
                type="button"
                onClick={handleRequestDataApiPermission}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#333',
                  color: '#fff',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Request Host Permission
              </button>
            </div>
            {permStatus && <div style={{ fontSize: '12px', color: '#2ecc71', marginTop: '4px' }}>{permStatus}</div>}
          </div>
        </div>
      </div>

      {/* 4. Debug Overlay Toggle */}
      <div
        style={{
          backgroundColor: '#181818',
          border: '1px solid #2e2e2e',
          borderRadius: '8px',
          padding: '20px'
        }}
      >
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Developer Debug Overlay</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
          <input
            type="checkbox"
            data-testid="debug-toggle"
            checked={settings.debug}
            onChange={async (e) => {
              await onUpdateSettings((prev) => ({
                ...prev,
                debug: e.target.checked
              }));
            }}
          />
          <span>Show visual card outline & pipeline decision inspection overlay on YouTube cards</span>
        </label>
      </div>

      {/* 5. Backup, Import & Export */}
      <div
        data-testid="backup-import-export-card"
        style={{
          backgroundColor: '#181818',
          border: '1px solid #2e2e2e',
          borderRadius: '8px',
          padding: '20px'
        }}
      >
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Backup & Restore Settings</h3>

        {importError && (
          <div data-testid="import-error-banner" style={{ padding: '8px 12px', backgroundColor: '#5a1e1e', color: '#ffaaaa', borderRadius: '4px', marginBottom: '12px', fontSize: '13px' }}>
            {importError}
          </div>
        )}
        {importSuccess && (
          <div data-testid="import-success-banner" style={{ padding: '8px 12px', backgroundColor: '#1e4a2a', color: '#aaffaa', borderRadius: '4px', marginBottom: '12px', fontSize: '13px' }}>
            {importSuccess}
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
          <button
            data-testid="export-settings-btn"
            onClick={handleExport}
            style={{
              padding: '8px 16px',
              backgroundColor: '#065fd4',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Export Settings (JSON)
          </button>

          <label
            style={{
              padding: '8px 16px',
              backgroundColor: '#292929',
              color: '#fff',
              border: '1px solid #444',
              borderRadius: '4px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Import Settings (JSON)
            <input
              type="file"
              data-testid="import-file-input"
              accept=".json"
              onChange={handleImportFile}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        <div style={{ borderTop: '1px solid #333', paddingTop: '16px' }}>
          <button
            data-testid="reset-everything-btn"
            onClick={handleResetEverything}
            style={{
              padding: '8px 16px',
              backgroundColor: '#272727',
              color: '#ff4444',
              border: '1px solid #444',
              borderRadius: '4px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Reset All Settings to Factory Defaults
          </button>
        </div>
      </div>
    </div>
  );
};
