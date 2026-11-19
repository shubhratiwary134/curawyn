import React, { useState } from 'react';
import { Settings } from '../../core/types';

interface Props {
  settings: Settings;
  onComplete: (updater: (prev: Settings) => Settings) => Promise<void>;
}

export const OnboardingModal: React.FC<Props> = ({ settings, onComplete }) => {
  const [selectedGenres, setSelectedGenres] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const [id, g] of Object.entries(settings.genres)) {
      init[id] = g.enabled;
    }
    return init;
  });

  const [blockShorts, setBlockShorts] = useState<boolean>(settings.shorts.blockAll);
  const [minMinutes, setMinMinutes] = useState<string>(
    settings.global.duration.minSec ? String(settings.global.duration.minSec / 60) : '5'
  );
  const [maxMinutes, setMaxMinutes] = useState<string>(
    settings.global.duration.maxSec ? String(settings.global.duration.maxSec / 60) : '60'
  );

  const toggleGenre = (genreId: string) => {
    setSelectedGenres((prev) => ({ ...prev, [genreId]: !prev[genreId] }));
  };

  const handleFinish = async () => {
    const minSec = minMinutes.trim() ? Math.max(0, Number(minMinutes) * 60) : null;
    const maxSec = maxMinutes.trim() ? Math.max(0, Number(maxMinutes) * 60) : null;

    await onComplete((prev) => {
      const updatedGenres = { ...prev.genres };
      for (const [id, enabled] of Object.entries(selectedGenres)) {
        if (updatedGenres[id]) {
          updatedGenres[id] = { ...updatedGenres[id], enabled };
        }
      }

      return {
        ...prev,
        onboardingDone: true,
        genres: updatedGenres,
        global: {
          ...prev.global,
          duration: { minSec, maxSec }
        },
        shorts: {
          ...prev.shorts,
          blockAll: blockShorts
        }
      };
    });
  };

  const genresList = Object.values(settings.genres).sort((a, b) => a.order - b.order);

  return (
    <div
      data-testid="onboarding-modal"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.85)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          backgroundColor: '#181818',
          border: '1px solid #333',
          borderRadius: '10px',
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.8)'
        }}
      >
        <div style={{ padding: '24px 24px 16px 24px', borderBottom: '1px solid #2a2a2a' }}>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '22px', color: '#fff' }}>
            Welcome to YouTube Feed Control
          </h2>
          <p style={{ margin: 0, color: '#aaa', fontSize: '13px' }}>
            Configure your initial feed whitelist. Until onboarding completes, the extension runs in{' '}
            <strong>passthrough mode</strong> so your feed remains untouched.
          </p>
        </div>

        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 1. Pick initial genres */}
          <div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#eee' }}>
              1. Select What You Want to See in Your Feed
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
              {genresList.map((g) => (
                <label
                  key={g.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    backgroundColor: selectedGenres[g.id] ? '#1a2b42' : '#222',
                    border: selectedGenres[g.id] ? '1px solid #065fd4' : '1px solid #333',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    color: '#fff'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!selectedGenres[g.id]}
                    onChange={() => toggleGenre(g.id)}
                  />
                  <span>{g.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 2. Global duration limits */}
          <div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#eee' }}>
              2. Preferred Video Duration Limits (Minutes)
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px' }}>
              <label>
                Min Duration:
                <input
                  type="number"
                  data-testid="onboarding-min-duration"
                  value={minMinutes}
                  onChange={(e) => setMinMinutes(e.target.value)}
                  style={{
                    marginLeft: '8px',
                    width: '60px',
                    padding: '6px',
                    backgroundColor: '#222',
                    color: '#fff',
                    border: '1px solid #444',
                    borderRadius: '4px'
                  }}
                />{' '}
                mins
              </label>

              <label>
                Max Duration:
                <input
                  type="number"
                  data-testid="onboarding-max-duration"
                  value={maxMinutes}
                  onChange={(e) => setMaxMinutes(e.target.value)}
                  style={{
                    marginLeft: '8px',
                    width: '60px',
                    padding: '6px',
                    backgroundColor: '#222',
                    color: '#fff',
                    border: '1px solid #444',
                    borderRadius: '4px'
                  }}
                />{' '}
                mins
              </label>
            </div>
          </div>

          {/* 3. Shorts Blocker toggle */}
          <div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#eee' }}>
              3. Shorts Blocker
            </h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                data-testid="onboarding-shorts-toggle"
                checked={blockShorts}
                onChange={(e) => setBlockShorts(e.target.checked)}
              />
              <span>Block all YouTube Shorts entry points (shelves, cards, and redirect to normal player)</span>
            </label>
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #2a2a2a', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            data-testid="onboarding-complete-btn"
            onClick={handleFinish}
            style={{
              padding: '10px 24px',
              backgroundColor: '#065fd4',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Complete Setup & Start Filtering
          </button>
        </div>
      </div>
    </div>
  );
};
