import React from 'react';
import { Settings } from '../../core/types';

interface Props {
  settings: Settings;
  onUpdateSettings: (updater: (prev: Settings) => Settings) => Promise<void>;
}

export const DiversityManager: React.FC<Props> = ({ settings, onUpdateSettings }) => {
  const d = settings.diversity;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ margin: '0 0 6px 0' }}>Smart Diversity Engine</h2>
        <p style={{ margin: 0, color: '#aaa', fontSize: '14px' }}>
          Prevents algorithmic fatigue by limiting repetition of channels, subgenres, duplicates,
          and recently watched content within feed sessions.
        </p>
      </div>

      <div
        style={{
          backgroundColor: '#181818',
          border: '1px solid #2e2e2e',
          borderRadius: '8px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {/* 1. Channel Cap */}
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
            Max Videos per Channel per Surface Session
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="number"
              min={1}
              max={10}
              data-testid="diversity-max-per-channel"
              value={d.maxPerChannel}
              onChange={async (e) => {
                const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                await onUpdateSettings((prev) => ({
                  ...prev,
                  diversity: { ...prev.diversity, maxPerChannel: val }
                }));
              }}
              style={{
                width: '80px',
                padding: '6px 8px',
                backgroundColor: '#222',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: '4px'
              }}
            />
            <span style={{ fontSize: '13px', color: '#888' }}>
              Keeps the first N videos from any single channel in DOM order, hiding later ones.
            </span>
          </div>
        </div>

        {/* 2. Deduplication */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
            <input
              type="checkbox"
              data-testid="diversity-dedupe-toggle"
              checked={d.dedupe}
              onChange={async (e) => {
                await onUpdateSettings((prev) => ({
                  ...prev,
                  diversity: { ...prev.diversity, dedupe: e.target.checked }
                }));
              }}
            />
            <span>Suppress Duplicate Videos on the Same Feed Session</span>
          </label>
        </div>

        {/* 3. Subgenre repetition sliding window */}
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
            Subgenre Repetition Sliding Window
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#ccc' }}>
            <span>Hide candidate if the last</span>
            <input
              type="number"
              min={1}
              data-testid="diversity-window-w"
              value={d.subgenreWindow.w}
              onChange={async (e) => {
                const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                await onUpdateSettings((prev) => ({
                  ...prev,
                  diversity: {
                    ...prev.diversity,
                    subgenreWindow: { ...prev.diversity.subgenreWindow, w: val }
                  }
                }));
              }}
              style={{
                width: '60px',
                padding: '4px 6px',
                backgroundColor: '#222',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: '4px'
              }}
            />
            <span>cards already contain</span>
            <input
              type="number"
              min={1}
              data-testid="diversity-window-k"
              value={d.subgenreWindow.k}
              onChange={async (e) => {
                const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                await onUpdateSettings((prev) => ({
                  ...prev,
                  diversity: {
                    ...prev.diversity,
                    subgenreWindow: { ...prev.diversity.subgenreWindow, k: val }
                  }
                }));
              }}
              style={{
                width: '60px',
                padding: '4px 6px',
                backgroundColor: '#222',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: '4px'
              }}
            />
            <span>cards of the same subgenre.</span>
          </div>
        </div>

        {/* 4. Recently shown impressions window */}
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
            Recently Shown Impressions Frequency Cap
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#ccc' }}>
            <span>Hide video after rendered</span>
            <input
              type="number"
              min={1}
              data-testid="diversity-max-impressions"
              value={d.maxImpressions}
              onChange={async (e) => {
                const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                await onUpdateSettings((prev) => ({
                  ...prev,
                  diversity: { ...prev.diversity, maxImpressions: val }
                }));
              }}
              style={{
                width: '60px',
                padding: '4px 6px',
                backgroundColor: '#222',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: '4px'
              }}
            />
            <span>times within</span>
            <input
              type="number"
              min={1}
              data-testid="diversity-window-hours"
              value={d.windowHours}
              onChange={async (e) => {
                const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                await onUpdateSettings((prev) => ({
                  ...prev,
                  diversity: { ...prev.diversity, windowHours: val }
                }));
              }}
              style={{
                width: '60px',
                padding: '4px 6px',
                backgroundColor: '#222',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: '4px'
              }}
            />
            <span>hours across sessions.</span>
          </div>
        </div>

        {/* 5. Already watched */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', marginBottom: '8px' }}>
            <input
              type="checkbox"
              data-testid="diversity-hide-watched-toggle"
              checked={d.hideWatched}
              onChange={async (e) => {
                await onUpdateSettings((prev) => ({
                  ...prev,
                  diversity: { ...prev.diversity, hideWatched: e.target.checked }
                }));
              }}
            />
            <span>Hide Already Watched Videos</span>
          </label>

          <div style={{ paddingLeft: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#ccc' }}>
            <span>Resume playback progress threshold:</span>
            <input
              type="number"
              min={1}
              max={100}
              data-testid="diversity-watched-threshold"
              value={d.watchedThresholdPct}
              onChange={async (e) => {
                const val = Math.min(100, Math.max(1, parseInt(e.target.value, 10) || 1));
                await onUpdateSettings((prev) => ({
                  ...prev,
                  diversity: { ...prev.diversity, watchedThresholdPct: val }
                }));
              }}
              style={{
                width: '60px',
                padding: '4px 6px',
                backgroundColor: '#222',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: '4px'
              }}
            />
            <span>%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
