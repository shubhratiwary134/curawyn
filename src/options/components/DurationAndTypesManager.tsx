import React, { useState } from 'react';
import { Settings, ContentTypeId, DurationRule } from '../../core/types';
import { resolveDuration } from '../../core/resolve/duration';
import { resolveContentTypes } from '../../core/resolve/contentTypes';
import { CONTENT_TYPE_REGISTRY } from '../../core/taxonomy/contentTypes';
import { ALL_CONTENT_TYPES } from '../../core/defaults';

interface Props {
  settings: Settings;
  onUpdateSettings: (updater: (prev: Settings) => Settings) => Promise<void>;
}

export const DurationAndTypesManager: React.FC<Props> = ({ settings, onUpdateSettings }) => {
  const [selectedGenreId, setSelectedGenreId] = useState<string>(
    Object.keys(settings.genres)[0] || ''
  );
  const [selectedSubgenreId, setSelectedSubgenreId] = useState<string>('');

  const genres = Object.values(settings.genres).sort((a, b) => a.order - b.order);
  const currentGenre = settings.genres[selectedGenreId] || null;
  const subgenres = currentGenre
    ? Object.values(settings.subgenres)
        .filter((s) => s.genreId === currentGenre.id)
        .sort((a, b) => a.order - b.order)
    : [];
  const currentSubgenre = selectedSubgenreId ? settings.subgenres[selectedSubgenreId] || null : null;

  // Global duration in minutes
  const globalMinMin =
    settings.global.duration.minSec !== null ? Math.round(settings.global.duration.minSec / 60) : '';
  const globalMaxMin =
    settings.global.duration.maxSec !== null ? Math.round(settings.global.duration.maxSec / 60) : '';

  const handleGlobalDurationChange = async (minStr: string, maxStr: string) => {
    const minSec = minStr.trim() !== '' ? Math.max(0, Number(minStr) * 60) : null;
    const maxSec = maxStr.trim() !== '' ? Math.max(0, Number(maxStr) * 60) : null;
    await onUpdateSettings((prev) => ({
      ...prev,
      global: {
        ...prev.global,
        duration: { minSec, maxSec }
      }
    }));
  };

  const handleToggleGlobalContentType = async (typeId: ContentTypeId) => {
    const current = settings.global.contentTypes;
    const next = current.includes(typeId)
      ? current.filter((t) => t !== typeId)
      : [...current, typeId];
    await onUpdateSettings((prev) => ({
      ...prev,
      global: {
        ...prev.global,
        contentTypes: next
      }
    }));
  };

  // Node duration helpers
  const targetNode = currentSubgenre || currentGenre;
  const nodeDuration: DurationRule = targetNode?.duration || { minSec: null, maxSec: null };
  const nodeMinMin =
    nodeDuration.minSec !== null ? Math.round(nodeDuration.minSec / 60) : '';
  const nodeMaxMin =
    nodeDuration.maxSec !== null ? Math.round(nodeDuration.maxSec / 60) : '';

  const handleNodeDurationChange = async (minStr: string, maxStr: string) => {
    const minSec = minStr.trim() !== '' ? Math.max(0, Number(minStr) * 60) : null;
    const maxSec = maxStr.trim() !== '' ? Math.max(0, Number(maxStr) * 60) : null;
    const rule: DurationRule | null =
      minSec === null && maxSec === null ? null : { minSec, maxSec };

    await onUpdateSettings((prev) => {
      if (currentSubgenre) {
        return {
          ...prev,
          subgenres: {
            ...prev.subgenres,
            [currentSubgenre.id]: {
              ...currentSubgenre,
              duration: rule
            }
          }
        };
      } else if (currentGenre) {
        return {
          ...prev,
          genres: {
            ...prev.genres,
            [currentGenre.id]: {
              ...currentGenre,
              duration: rule
            }
          }
        };
      }
      return prev;
    });
  };

  // Node content types helpers
  const nodeTypes = targetNode?.contentTypes ?? null; // null = inherit
  const isInherited = nodeTypes === null;
  const isBlockedAll = Array.isArray(nodeTypes) && nodeTypes.length === 0;

  const handleSetNodeContentTypeMode = async (mode: 'inherit' | 'custom' | 'block_all') => {
    let next: ContentTypeId[] | null = null;
    if (mode === 'inherit') {
      next = null;
    } else if (mode === 'block_all') {
      next = [];
    } else {
      next = [...(effectiveTypes.value.length > 0 ? effectiveTypes.value : ALL_CONTENT_TYPES)];
    }

    await onUpdateSettings((prev) => {
      if (currentSubgenre) {
        return {
          ...prev,
          subgenres: {
            ...prev.subgenres,
            [currentSubgenre.id]: {
              ...currentSubgenre,
              contentTypes: next
            }
          }
        };
      } else if (currentGenre) {
        return {
          ...prev,
          genres: {
            ...prev.genres,
            [currentGenre.id]: {
              ...currentGenre,
              contentTypes: next
            }
          }
        };
      }
      return prev;
    });
  };

  const handleToggleNodeContentType = async (typeId: ContentTypeId) => {
    const active = nodeTypes ? [...nodeTypes] : [...effectiveTypes.value];
    const updated = active.includes(typeId)
      ? active.filter((t) => t !== typeId)
      : [...active, typeId];

    await onUpdateSettings((prev) => {
      if (currentSubgenre) {
        return {
          ...prev,
          subgenres: {
            ...prev.subgenres,
            [currentSubgenre.id]: {
              ...currentSubgenre,
              contentTypes: updated
            }
          }
        };
      } else if (currentGenre) {
        return {
          ...prev,
          genres: {
            ...prev.genres,
            [currentGenre.id]: {
              ...currentGenre,
              contentTypes: updated
            }
          }
        };
      }
      return prev;
    });
  };

  // Effective resolver values
  const effectiveDuration = resolveDuration(
    currentSubgenre,
    currentGenre,
    settings.global.duration
  );

  const effectiveTypes = resolveContentTypes(
    currentSubgenre,
    currentGenre,
    settings.global.contentTypes
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Global Defaults Card */}
      <div
        data-testid="global-duration-types-card"
        style={{
          backgroundColor: '#181818',
          border: '1px solid #2e2e2e',
          borderRadius: '8px',
          padding: '20px'
        }}
      >
        <h2 style={{ margin: '0 0 6px 0', fontSize: '18px' }}>Global Defaults</h2>
        <p style={{ margin: '0 0 16px 0', color: '#aaa', fontSize: '13px' }}>
          Applies to all videos unless overridden by a specific genre or subgenre.
        </p>

        {/* Global duration inputs */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
            Global Duration Limits (Minutes)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ fontSize: '13px', color: '#ccc' }}>
              Min:
              <input
                type="number"
                data-testid="global-min-duration-input"
                placeholder="None"
                value={globalMinMin}
                onChange={(e) => handleGlobalDurationChange(e.target.value, String(globalMaxMin))}
                style={{
                  marginLeft: '6px',
                  width: '80px',
                  padding: '6px 8px',
                  backgroundColor: '#222',
                  color: '#fff',
                  border: '1px solid #444',
                  borderRadius: '4px'
                }}
              />
            </label>

            <label style={{ fontSize: '13px', color: '#ccc' }}>
              Max:
              <input
                type="number"
                data-testid="global-max-duration-input"
                placeholder="None"
                value={globalMaxMin}
                onChange={(e) => handleGlobalDurationChange(String(globalMinMin), e.target.value)}
                style={{
                  marginLeft: '6px',
                  width: '80px',
                  padding: '6px 8px',
                  backgroundColor: '#222',
                  color: '#fff',
                  border: '1px solid #444',
                  borderRadius: '4px'
                }}
              />
            </label>

            {settings.global.duration.minSec !== null &&
              settings.global.duration.maxSec !== null &&
              settings.global.duration.minSec > settings.global.duration.maxSec && (
                <span
                  data-testid="global-duration-error"
                  style={{ color: '#ff5555', fontSize: '13px' }}
                >
                  ⚠ Min duration cannot exceed Max duration!
                </span>
              )}
          </div>
        </div>

        {/* Global allowed content types */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
            Global Allowed Content Types ({settings.global.contentTypes.length} / 16 active)
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {ALL_CONTENT_TYPES.map((typeId) => {
              const active = settings.global.contentTypes.includes(typeId);
              const info = CONTENT_TYPE_REGISTRY[typeId];
              return (
                <button
                  key={typeId}
                  data-testid={`global-type-chip-${typeId}`}
                  onClick={() => handleToggleGlobalContentType(typeId)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    backgroundColor: active ? '#065fd4' : '#272727',
                    color: active ? '#fff' : '#888',
                    border: active ? '1px solid #3880ff' : '1px solid #3d3d3d'
                  }}
                  title={info.description}
                >
                  {info.label} {active ? '✓' : ''}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Per-Node Overrides & Effective Preview */}
      <div
        data-testid="node-overrides-card"
        style={{
          backgroundColor: '#181818',
          border: '1px solid #2e2e2e',
          borderRadius: '8px',
          padding: '20px'
        }}
      >
        <h2 style={{ margin: '0 0 6px 0', fontSize: '18px' }}>
          Per-Genre & Per-Subgenre Overrides & Effective Rules
        </h2>
        <p style={{ margin: '0 0 16px 0', color: '#aaa', fontSize: '13px' }}>
          Select a genre and optionally a subgenre to inspect its effective rules (resolved per-bound
          subgenre → genre → global).
        </p>

        {/* Node selector */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#aaa', marginBottom: '4px' }}>
              Genre:
            </label>
            <select
              data-testid="select-genre"
              value={selectedGenreId}
              onChange={(e) => {
                setSelectedGenreId(e.target.value);
                setSelectedSubgenreId('');
              }}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#222',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: '4px'
              }}
            >
              {genres.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#aaa', marginBottom: '4px' }}>
              Subgenre (Optional):
            </label>
            <select
              data-testid="select-subgenre"
              value={selectedSubgenreId}
              onChange={(e) => setSelectedSubgenreId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#222',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: '4px'
              }}
            >
              <option value="">[All / Genre Level]</option>
              {subgenres.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {targetNode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Target node duration override */}
            <div
              style={{
                backgroundColor: '#202020',
                padding: '16px',
                borderRadius: '6px',
                border: '1px solid #333'
              }}
            >
              <h3 style={{ margin: '0 0 10px 0', fontSize: '15px' }}>
                Duration Override for {targetNode.name}
              </h3>
              <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#888' }}>
                Leave empty to inherit that specific bound independently from the parent/global.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                <label style={{ fontSize: '13px' }}>
                  Override Min (min):
                  <input
                    type="number"
                    data-testid="node-min-override-input"
                    placeholder="Inherit"
                    value={nodeMinMin}
                    onChange={(e) =>
                      handleNodeDurationChange(e.target.value, String(nodeMaxMin))
                    }
                    style={{
                      marginLeft: '6px',
                      width: '80px',
                      padding: '4px 8px',
                      backgroundColor: '#161616',
                      color: '#fff',
                      border: '1px solid #444',
                      borderRadius: '4px'
                    }}
                  />
                </label>

                <label style={{ fontSize: '13px' }}>
                  Override Max (min):
                  <input
                    type="number"
                    data-testid="node-max-override-input"
                    placeholder="Inherit"
                    value={nodeMaxMin}
                    onChange={(e) =>
                      handleNodeDurationChange(String(nodeMinMin), e.target.value)
                    }
                    style={{
                      marginLeft: '6px',
                      width: '80px',
                      padding: '4px 8px',
                      backgroundColor: '#161616',
                      color: '#fff',
                      border: '1px solid #444',
                      borderRadius: '4px'
                    }}
                  />
                </label>
              </div>

              {/* Effective duration preview */}
              <div
                data-testid="effective-duration-preview"
                style={{
                  backgroundColor: '#141414',
                  padding: '10px 14px',
                  borderRadius: '4px',
                  border: effectiveDuration.isValid ? '1px solid #2a4020' : '1px solid #661111',
                  fontSize: '13px'
                }}
              >
                <div>
                  <strong>Effective Duration: </strong>
                  <span>
                    Min:{' '}
                    {effectiveDuration.value.minSec !== null
                      ? `${Math.round(effectiveDuration.value.minSec / 60)}m`
                      : 'None'}{' '}
                    <em>(from {effectiveDuration.inheritedFrom.minSec})</em>
                    {' — '}
                    Max:{' '}
                    {effectiveDuration.value.maxSec !== null
                      ? `${Math.round(effectiveDuration.value.maxSec / 60)}m`
                      : 'None'}{' '}
                    <em>(from {effectiveDuration.inheritedFrom.maxSec})</em>
                  </span>
                </div>
                {!effectiveDuration.isValid && (
                  <div
                    data-testid="effective-duration-error"
                    style={{ color: '#ff6666', marginTop: '4px' }}
                  >
                    ⚠ {effectiveDuration.error}
                  </div>
                )}
              </div>
            </div>

            {/* Target node content types override */}
            <div
              style={{
                backgroundColor: '#202020',
                padding: '16px',
                borderRadius: '6px',
                border: '1px solid #333'
              }}
            >
              <h3 style={{ margin: '0 0 10px 0', fontSize: '15px' }}>
                Content Types Override for {targetNode.name}
              </h3>

              {/* Mode toggles */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                <label style={{ fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="ct-mode"
                    data-testid="ct-mode-inherit"
                    checked={isInherited}
                    onChange={() => handleSetNodeContentTypeMode('inherit')}
                  />{' '}
                  Inherit from parent ({currentSubgenre ? 'Genre' : 'Global'})
                </label>

                <label style={{ fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="ct-mode"
                    data-testid="ct-mode-custom"
                    checked={!isInherited && !isBlockedAll}
                    onChange={() => handleSetNodeContentTypeMode('custom')}
                  />{' '}
                  Custom Selection
                </label>

                <label style={{ fontSize: '13px', color: '#ff6666', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="ct-mode"
                    data-testid="ct-mode-block-all"
                    checked={isBlockedAll}
                    onChange={() => {
                      if (
                        window.confirm(
                          `Block ALL content types for "${targetNode.name}"? No videos of this node will pass.`
                        )
                      ) {
                        handleSetNodeContentTypeMode('block_all');
                      }
                    }}
                  />{' '}
                  Block All Types
                </label>
              </div>

              {/* Type checkboxes if custom */}
              {!isInherited && !isBlockedAll && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                  {ALL_CONTENT_TYPES.map((typeId) => {
                    const active = (nodeTypes || []).includes(typeId);
                    const info = CONTENT_TYPE_REGISTRY[typeId];
                    return (
                      <button
                        key={typeId}
                        data-testid={`node-type-chip-${typeId}`}
                        onClick={() => handleToggleNodeContentType(typeId)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '14px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          backgroundColor: active ? '#065fd4' : '#282828',
                          color: active ? '#fff' : '#777',
                          border: active ? '1px solid #3880ff' : '1px solid #3e3e3e'
                        }}
                      >
                        {info.label} {active ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Effective content types preview */}
              <div
                data-testid="effective-types-preview"
                style={{
                  backgroundColor: '#141414',
                  padding: '10px 14px',
                  borderRadius: '4px',
                  border: '1px solid #2a4020',
                  fontSize: '13px'
                }}
              >
                <strong>Effective Allowed Types: </strong>
                <span>
                  {effectiveTypes.isExplicitEmpty
                    ? 'None (All blocked)'
                    : `${effectiveTypes.value.length} types allowed`}{' '}
                  <em>(inherited from {effectiveTypes.inheritedFrom})</em>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
