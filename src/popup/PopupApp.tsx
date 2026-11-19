import React, { useState, useEffect } from 'react';
import { Settings } from '../core/types';
import { DEFAULT_SETTINGS } from '../core/defaults';
import { getSettings, patchSettings, subscribeSettings } from '../platform/settingsStore';
import { getTodayStats, ReasonStats, getDefaultStats } from '../platform/statsStore';

export const PopupApp: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<ReasonStats>(getDefaultStats());
  const [loading, setLoading] = useState(true);
  const [isPausedSession, setIsPausedSession] = useState(false);

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
    getTodayStats().then((st) => setStats(st));

    const unsub = subscribeSettings((updated) => setSettings(updated));
    return unsub;
  }, []);

  const handleToggleMaster = async () => {
    const next = !settings.enabled;
    setSettings((prev) => ({ ...prev, enabled: next }));
    await patchSettings({ enabled: next });
  };

  const handleToggleShorts = async () => {
    const next = !settings.shorts.blockAll;
    setSettings((prev) => ({
      ...prev,
      shorts: { ...prev.shorts, blockAll: next }
    }));
    await patchSettings((prev) => ({
      shorts: { ...prev.shorts, blockAll: next }
    }));
  };

  const handlePause30Min = async () => {
    await patchSettings({ enabled: false });
    // In service worker or timer, could re-enable after 30 min
    setTimeout(async () => {
      await patchSettings({ enabled: true });
    }, 30 * 60 * 1000);
  };

  const openOptions = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('options.html', '_blank');
    }
  };

  if (loading) {
    return <div style={{ padding: '16px', color: '#888' }}>Loading...</div>;
  }

  return (
    <div
      style={{
        width: '320px',
        padding: '16px',
        backgroundColor: '#0f0f0f',
        color: '#f1f1f1',
        boxSizing: 'border-box'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
          borderBottom: '1px solid #222',
          paddingBottom: '10px'
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>Feed Control</h2>
          <div style={{ fontSize: '11px', color: '#2ecc71', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2ecc71' }}></span>
            Health: Operational
          </div>
        </div>
        <button
          data-testid="popup-open-options-btn"
          onClick={openOptions}
          style={{
            background: 'none',
            border: '1px solid #444',
            borderRadius: '4px',
            color: '#aaa',
            padding: '4px 8px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          ⚙ Options
        </button>
      </div>

      {/* Main Toggles */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
        {/* Master Toggle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#1a1a1a',
            padding: '10px 12px',
            borderRadius: '6px',
            border: '1px solid #2a2a2a'
          }}
        >
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Master Filter</div>
            <div style={{ fontSize: '11px', color: '#888' }}>
              {settings.enabled ? 'Filtering is Active' : 'Passthrough Mode'}
            </div>
          </div>
          <button
            data-testid="popup-master-toggle"
            onClick={handleToggleMaster}
            style={{
              padding: '6px 14px',
              backgroundColor: settings.enabled ? '#065fd4' : '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '16px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            {settings.enabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Shorts Toggle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#1a1a1a',
            padding: '10px 12px',
            borderRadius: '6px',
            border: '1px solid #2a2a2a'
          }}
        >
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Block Shorts</div>
            <div style={{ fontSize: '11px', color: '#888' }}>Hide shelves & redirect</div>
          </div>
          <button
            data-testid="popup-shorts-toggle"
            onClick={handleToggleShorts}
            style={{
              padding: '6px 14px',
              backgroundColor: settings.shorts.blockAll ? '#cc0000' : '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '16px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            {settings.shorts.blockAll ? 'BLOCKED' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Quick Pause Actions */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={handlePause30Min}
          style={{
            flex: 1,
            padding: '6px',
            backgroundColor: '#262626',
            color: '#ccc',
            border: '1px solid #383838',
            borderRadius: '4px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          ⏸ Pause 30m
        </button>
        <button
          onClick={() => setIsPausedSession(!isPausedSession)}
          style={{
            flex: 1,
            padding: '6px',
            backgroundColor: isPausedSession ? '#4a3000' : '#262626',
            color: isPausedSession ? '#ffaa00' : '#ccc',
            border: isPausedSession ? '1px solid #ffaa00' : '1px solid #383838',
            borderRadius: '4px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          {isPausedSession ? '▶ Resume' : '⏸ Pause Session'}
        </button>
      </div>

      {/* Today's Stats Breakdown */}
      <div
        data-testid="popup-stats-card"
        style={{
          backgroundColor: '#141414',
          border: '1px solid #222',
          borderRadius: '6px',
          padding: '12px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ccc' }}>Today's Activity</span>
          <span style={{ fontSize: '12px', color: '#065fd4', fontWeight: 'bold' }}>
            {stats.totalHidden} Hidden
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px', color: '#888' }}>
          <div>Shorts: <strong style={{ color: '#fff' }}>{stats.shorts}</strong></div>
          <div>Blacklist: <strong style={{ color: '#fff' }}>{stats.blacklist}</strong></div>
          <div>Whitelist: <strong style={{ color: '#fff' }}>{stats.whitelist}</strong></div>
          <div>Duration: <strong style={{ color: '#fff' }}>{stats.duration}</strong></div>
          <div>Content Type: <strong style={{ color: '#fff' }}>{stats.contentType}</strong></div>
          <div>Diversity: <strong style={{ color: '#fff' }}>{stats.diversity}</strong></div>
        </div>
      </div>
    </div>
  );
};
