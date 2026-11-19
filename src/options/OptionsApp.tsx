import React, { useState, useEffect } from 'react';
import { Settings } from '../core/types';
import { DEFAULT_SETTINGS } from '../core/defaults';
import { getSettings, patchSettings, subscribeSettings } from '../platform/settingsStore';
import { GenresManager } from './components/GenresManager';

export type OptionsTab =
  | 'general'
  | 'genres'
  | 'durations'
  | 'blacklist'
  | 'diversity'
  | 'shorts'
  | 'advanced';

export const OptionsApp: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<OptionsTab>('genres');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });

    const unsub = subscribeSettings((updated) => {
      setSettings(updated);
    });
    return unsub;
  }, []);

  const handleUpdateSettings = async (updater: (prev: Settings) => Settings) => {
    const next = updater(settings);
    setSettings(next);
    await patchSettings(next);
  };

  if (loading) {
    return <div style={{ padding: '32px', color: '#888' }}>Loading settings...</div>;
  }

  const tabs: { id: OptionsTab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'genres', label: 'Genres & Subgenres' },
    { id: 'durations', label: 'Duration & Types' },
    { id: 'blacklist', label: 'Blacklist' },
    { id: 'diversity', label: 'Diversity Engine' },
    { id: 'shorts', label: 'Shorts' },
    { id: 'advanced', label: 'Advanced' }
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 20px', minHeight: '100vh' }}>
      <header style={{ marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '14px' }}>
        <h1 style={{ margin: '0 0 6px 0', fontSize: '24px' }}>YouTube Feed Control</h1>
        <p style={{ margin: 0, color: '#aaa', fontSize: '14px' }}>
          Manifest V3 client-side user filtering layer for YouTube
        </p>
      </header>

      {/* Navigation tabs */}
      <nav style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            data-testid={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              backgroundColor: activeTab === tab.id ? '#065fd4' : '#222',
              color: activeTab === tab.id ? '#fff' : '#aaa',
              border: 'none',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab content */}
      <main>
        {activeTab === 'genres' && (
          <GenresManager settings={settings} onUpdateSettings={handleUpdateSettings} />
        )}
        {activeTab === 'general' && (
          <div data-testid="tab-content-general" style={{ color: '#aaa' }}>
            General surface modes & master toggles.
          </div>
        )}
        {activeTab === 'durations' && (
          <div data-testid="tab-content-durations" style={{ color: '#aaa' }}>
            Duration & Content Types controls.
          </div>
        )}
        {activeTab === 'blacklist' && (
          <div data-testid="tab-content-blacklist" style={{ color: '#aaa' }}>
            Blacklist management.
          </div>
        )}
        {activeTab === 'diversity' && (
          <div data-testid="tab-content-diversity" style={{ color: '#aaa' }}>
            Diversity engine settings.
          </div>
        )}
        {activeTab === 'shorts' && (
          <div data-testid="tab-content-shorts" style={{ color: '#aaa' }}>
            Shorts blocker settings.
          </div>
        )}
        {activeTab === 'advanced' && (
          <div data-testid="tab-content-advanced" style={{ color: '#aaa' }}>
            Advanced settings, backup, and restore.
          </div>
        )}
      </main>
    </div>
  );
};
