import React, { useState } from 'react';
import { Settings, Genre, Subgenre } from '../../core/types';
import {
  createGenre,
  updateGenre,
  deleteGenre,
  createSubgenre,
  updateSubgenre,
  deleteSubgenre,
  reorderGenres,
  reorderSubgenres,
  resetToSeedTaxonomy
} from '../../core/taxonomy/taxonomyOps';

interface Props {
  settings: Settings;
  onUpdateSettings: (updater: (prev: Settings) => Settings) => Promise<void>;
}

export const GenresManager: React.FC<Props> = ({ settings, onUpdateSettings }) => {
  const [expandedGenres, setExpandedGenres] = useState<Record<string, boolean>>({});
  const [editingSubgenreKeywords, setEditingSubgenreKeywords] = useState<string | null>(null);
  const [newGenreName, setNewGenreName] = useState('');
  const [newSubgenreNames, setNewSubgenreNames] = useState<Record<string, string>>({});
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleExpand = (genreId: string) => {
    setExpandedGenres((prev) => ({ ...prev, [genreId]: !prev[genreId] }));
  };

  const handleAddGenre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGenreName.trim()) return;
    try {
      setErrorMsg(null);
      const id = 'genre_' + Date.now();
      await onUpdateSettings((prev) =>
        createGenre(prev, {
          id,
          name: newGenreName.trim(),
          enabled: true,
          blocked: false,
          duration: null,
          contentTypes: null,
          ytCategoryIds: [],
          builtIn: false
        })
      );
      setNewGenreName('');
      setExpandedGenres((prev) => ({ ...prev, [id]: true }));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const handleAddSubgenre = async (genreId: string) => {
    const name = newSubgenreNames[genreId]?.trim();
    if (!name) return;
    try {
      setErrorMsg(null);
      const id = 'sub_' + Date.now();
      await onUpdateSettings((prev) =>
        createSubgenre(prev, {
          id,
          genreId,
          name,
          enabled: true,
          blocked: false,
          duration: null,
          contentTypes: null,
          include: [{ term: name.toLowerCase(), weight: 2 }],
          exclude: [],
          builtIn: false
        })
      );
      setNewSubgenreNames((prev) => ({ ...prev, [genreId]: '' }));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const sortedGenres = Object.values(settings.genres).sort((a, b) => a.order - b.order);

  const moveGenre = async (genreId: string, direction: 'up' | 'down') => {
    const idx = sortedGenres.findIndex((g) => g.id === genreId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sortedGenres.length) return;

    const newOrder = [...sortedGenres];
    const [moved] = newOrder.splice(idx, 1);
    newOrder.splice(targetIdx, 0, moved);

    await onUpdateSettings((prev) => reorderGenres(prev, newOrder.map((g) => g.id)));
  };

  const moveSubgenre = async (genreId: string, subgenreId: string, direction: 'up' | 'down') => {
    const subs = Object.values(settings.subgenres)
      .filter((s) => s.genreId === genreId)
      .sort((a, b) => a.order - b.order);
    const idx = subs.findIndex((s) => s.id === subgenreId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= subs.length) return;

    const newOrder = [...subs];
    const [moved] = newOrder.splice(idx, 1);
    newOrder.splice(targetIdx, 0, moved);

    await onUpdateSettings((prev) =>
      reorderSubgenres(prev, genreId, newOrder.map((s) => s.id))
    );
  };

  const handleResetToSeed = async () => {
    if (window.confirm('Reset all genres, subgenres and keywords to seed defaults?')) {
      await onUpdateSettings((prev) => resetToSeedTaxonomy(prev));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0' }}>Genres & Subgenres Whitelist</h2>
          <p style={{ margin: 0, color: '#aaa', fontSize: '14px' }}>
            A video appears on filtered surfaces only if it matches an <strong>enabled</strong> genre
            and subgenre. <strong>Blocked</strong> acts as a hard exclusion overriding everything.
          </p>
        </div>
        <button
          onClick={handleResetToSeed}
          style={{
            padding: '8px 14px',
            backgroundColor: '#272727',
            color: '#ff4444',
            border: '1px solid #444',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reset to Seed Taxonomy
        </button>
      </div>

      {errorMsg && (
        <div style={{ padding: '8px 12px', backgroundColor: '#5a1e1e', color: '#ffaaaa', borderRadius: '4px' }}>
          {errorMsg}
        </div>
      )}

      {/* Add new genre form */}
      <form onSubmit={handleAddGenre} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          placeholder="New custom genre name..."
          value={newGenreName}
          onChange={(e) => setNewGenreName(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 12px',
            backgroundColor: '#1f1f1f',
            color: '#fff',
            border: '1px solid #333',
            borderRadius: '4px'
          }}
        />
        <button
          type="submit"
          style={{
            padding: '8px 16px',
            backgroundColor: '#065fd4',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          + Add Genre
        </button>
      </form>

      {/* Genres tree list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {sortedGenres.map((genre) => {
          const isExpanded = !!expandedGenres[genre.id];
          const subgenres = Object.values(settings.subgenres)
            .filter((s) => s.genreId === genre.id)
            .sort((a, b) => a.order - b.order);

          return (
            <div
              key={genre.id}
              data-testid={`genre-card-${genre.id}`}
              style={{
                backgroundColor: genre.blocked ? '#2a1414' : '#181818',
                border: genre.blocked ? '1px solid #cc0000' : '1px solid #2d2d2d',
                borderRadius: '6px',
                padding: '12px'
              }}
            >
              {/* Genre header row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <button
                    aria-label={`Toggle expand ${genre.name}`}
                    onClick={() => toggleExpand(genre.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#aaa',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: '4px 6px'
                    }}
                  >
                    {isExpanded ? '▼' : '▶'}
                  </button>

                  {editingNameId === genre.id ? (
                    <input
                      type="text"
                      value={tempName}
                      autoFocus
                      onChange={(e) => setTempName(e.target.value)}
                      onBlur={async () => {
                        if (tempName.trim()) {
                          try {
                            await onUpdateSettings((prev) =>
                              updateGenre(prev, genre.id, { name: tempName.trim() })
                            );
                          } catch (err) {
                            setErrorMsg(err instanceof Error ? err.message : String(err));
                          }
                        }
                        setEditingNameId(null);
                      }}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#222',
                        color: '#fff',
                        border: '1px solid #555',
                        borderRadius: '4px'
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontWeight: 'bold',
                        fontSize: '15px',
                        color: genre.blocked ? '#ff6b6b' : '#fff',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setEditingNameId(genre.id);
                        setTempName(genre.name);
                      }}
                      title="Click to rename"
                    >
                      {genre.name}
                    </span>
                  )}

                  {genre.blocked && (
                    <span
                      data-testid={`genre-blocked-badge-${genre.id}`}
                      style={{
                        fontSize: '11px',
                        padding: '2px 6px',
                        backgroundColor: '#cc0000',
                        color: '#fff',
                        borderRadius: '3px',
                        fontWeight: 'bold'
                      }}
                    >
                      HARD BLOCKED
                    </span>
                  )}
                  <span style={{ fontSize: '12px', color: '#777' }}>
                    ({subgenres.length} subgenres)
                  </span>
                </div>

                {/* Genre controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      opacity: genre.blocked ? 0.4 : 1
                    }}
                  >
                    <input
                      type="checkbox"
                      data-testid={`genre-enable-toggle-${genre.id}`}
                      checked={genre.enabled}
                      disabled={genre.blocked}
                      onChange={async (e) => {
                        await onUpdateSettings((prev) =>
                          updateGenre(prev, genre.id, { enabled: e.target.checked })
                        );
                      }}
                    />
                    Enabled
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '13px',
                      color: '#ff6666',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      data-testid={`genre-block-toggle-${genre.id}`}
                      checked={genre.blocked}
                      onChange={async (e) => {
                        await onUpdateSettings((prev) =>
                          updateGenre(prev, genre.id, { blocked: e.target.checked })
                        );
                      }}
                    />
                    Blocked
                  </label>

                  <button
                    onClick={() => moveGenre(genre.id, 'up')}
                    style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                    title="Move up"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveGenre(genre.id, 'down')}
                    style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                    title="Move down"
                  >
                    ▼
                  </button>

                  <button
                    onClick={async () => {
                      if (window.confirm(`Delete genre "${genre.name}" and all its subgenres?`)) {
                        await onUpdateSettings((prev) => deleteGenre(prev, genre.id));
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ff4444',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                    title="Delete genre"
                  >
                    🗑
                  </button>
                </div>
              </div>

              {/* Subgenres tree block */}
              {isExpanded && (
                <div
                  style={{
                    marginTop: '12px',
                    paddingLeft: '24px',
                    borderLeft: '2px solid #333',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  {subgenres.map((sub) => {
                    const isKeywordsOpen = editingSubgenreKeywords === sub.id;
                    const isParentBlocked = genre.blocked;
                    const isParentDisabled = !genre.enabled;

                    return (
                      <div
                        key={sub.id}
                        data-testid={`subgenre-row-${sub.id}`}
                        style={{
                          backgroundColor: sub.blocked || isParentBlocked ? '#221111' : '#202020',
                          border: '1px solid #2e2e2e',
                          borderRadius: '4px',
                          padding: '8px 12px'
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {editingNameId === sub.id ? (
                              <input
                                type="text"
                                value={tempName}
                                autoFocus
                                onChange={(e) => setTempName(e.target.value)}
                                onBlur={async () => {
                                  if (tempName.trim()) {
                                    try {
                                      await onUpdateSettings((prev) =>
                                        updateSubgenre(prev, sub.id, { name: tempName.trim() })
                                      );
                                    } catch (err) {
                                      setErrorMsg(err instanceof Error ? err.message : String(err));
                                    }
                                  }
                                  setEditingNameId(null);
                                }}
                                onKeyDown={async (e) => {
                                  if (e.key === 'Enter') {
                                    (e.target as HTMLInputElement).blur();
                                  }
                                }}
                                style={{
                                  padding: '2px 6px',
                                  backgroundColor: '#111',
                                  color: '#fff',
                                  border: '1px solid #555',
                                  borderRadius: '3px'
                                }}
                              />
                            ) : (
                              <span
                                style={{
                                  fontSize: '14px',
                                  color: sub.blocked || isParentBlocked ? '#ff8888' : '#e0e0e0',
                                  cursor: 'pointer'
                                }}
                                onClick={() => {
                                  setEditingNameId(sub.id);
                                  setTempName(sub.name);
                                }}
                                title="Click to rename"
                              >
                                {sub.name}
                              </span>
                            )}

                            {isParentBlocked && (
                              <span
                                style={{ fontSize: '10px', color: '#ff5555' }}
                                data-testid={`subgenre-parent-blocked-${sub.id}`}
                              >
                                (Parent Blocked)
                              </span>
                            )}
                            {isParentDisabled && !isParentBlocked && (
                              <span style={{ fontSize: '10px', color: '#888' }}>
                                (Parent Disabled)
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button
                              onClick={() =>
                                setEditingSubgenreKeywords(isKeywordsOpen ? null : sub.id)
                              }
                              style={{
                                padding: '3px 8px',
                                backgroundColor: isKeywordsOpen ? '#333' : '#272727',
                                color: '#aaa',
                                border: '1px solid #444',
                                borderRadius: '3px',
                                fontSize: '11px',
                                cursor: 'pointer'
                              }}
                            >
                              Keywords ({sub.include.length})
                            </button>

                            <label
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '12px',
                                opacity: sub.blocked || isParentBlocked ? 0.4 : 1,
                                cursor: 'pointer'
                              }}
                            >
                              <input
                                type="checkbox"
                                data-testid={`subgenre-enable-toggle-${sub.id}`}
                                checked={sub.enabled}
                                disabled={sub.blocked || isParentBlocked}
                                onChange={async (e) => {
                                  await onUpdateSettings((prev) =>
                                    updateSubgenre(prev, sub.id, { enabled: e.target.checked })
                                  );
                                }}
                              />
                              Enabled
                            </label>

                            <label
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '12px',
                                color: '#ff6666',
                                cursor: 'pointer'
                              }}
                            >
                              <input
                                type="checkbox"
                                data-testid={`subgenre-block-toggle-${sub.id}`}
                                checked={sub.blocked}
                                onChange={async (e) => {
                                  await onUpdateSettings((prev) =>
                                    updateSubgenre(prev, sub.id, { blocked: e.target.checked })
                                  );
                                }}
                              />
                              Blocked
                            </label>

                            <button
                              onClick={() => moveSubgenre(genre.id, sub.id, 'up')}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#777',
                                cursor: 'pointer'
                              }}
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => moveSubgenre(genre.id, sub.id, 'down')}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#777',
                                cursor: 'pointer'
                              }}
                            >
                              ▼
                            </button>

                            <button
                              onClick={async () => {
                                if (confirm(`Delete subgenre "${sub.name}"?`)) {
                                  await onUpdateSettings((prev) => deleteSubgenre(prev, sub.id));
                                }
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ff4444',
                                cursor: 'pointer'
                              }}
                              title="Delete subgenre"
                            >
                              🗑
                            </button>
                          </div>
                        </div>

                        {/* Keyword editor drawer */}
                        {isKeywordsOpen && (
                          <div
                            data-testid={`keyword-editor-${sub.id}`}
                            style={{
                              marginTop: '8px',
                              padding: '10px',
                              backgroundColor: '#161616',
                              borderRadius: '4px',
                              border: '1px solid #333'
                            }}
                          >
                            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>
                              Include Keywords (with weights)
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                              {sub.include.map((kw, i) => (
                                <span
                                  key={i}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    backgroundColor: '#262626',
                                    border: '1px solid #444',
                                    borderRadius: '3px',
                                    padding: '2px 6px',
                                    fontSize: '11px'
                                  }}
                                >
                                  {kw.term} (w:{kw.weight})
                                  <button
                                    onClick={async () => {
                                      const nextInc = sub.include.filter((_, idx) => idx !== i);
                                      await onUpdateSettings((prev) =>
                                        updateSubgenre(prev, sub.id, { include: nextInc })
                                      );
                                    }}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#ff4444',
                                      cursor: 'pointer',
                                      padding: '0 2px'
                                    }}
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                            <SubgenreAddKeywordForm
                              onAdd={async (term, weight) => {
                                await onUpdateSettings((prev) =>
                                  updateSubgenre(prev, sub.id, {
                                    include: [...sub.include, { term, weight }]
                                  })
                                );
                              }}
                            />

                            <div
                              style={{
                                fontSize: '12px',
                                fontWeight: 'bold',
                                marginTop: '10px',
                                marginBottom: '6px'
                              }}
                            >
                              Exclude Keywords (hard exclude signals)
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                              {sub.exclude.map((ex, i) => (
                                <span
                                  key={i}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    backgroundColor: '#351818',
                                    border: '1px solid #662222',
                                    borderRadius: '3px',
                                    padding: '2px 6px',
                                    fontSize: '11px',
                                    color: '#ffaaaa'
                                  }}
                                >
                                  {ex}
                                  <button
                                    onClick={async () => {
                                      const nextEx = sub.exclude.filter((_, idx) => idx !== i);
                                      await onUpdateSettings((prev) =>
                                        updateSubgenre(prev, sub.id, { exclude: nextEx })
                                      );
                                    }}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#ff4444',
                                      cursor: 'pointer',
                                      padding: '0 2px'
                                    }}
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                            <SubgenreAddExcludeForm
                              onAdd={async (term) => {
                                await onUpdateSettings((prev) =>
                                  updateSubgenre(prev, sub.id, {
                                    exclude: [...sub.exclude, term]
                                  })
                                );
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add subgenre row */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    <input
                      type="text"
                      placeholder="New subgenre name..."
                      value={newSubgenreNames[genre.id] || ''}
                      onChange={(e) =>
                        setNewSubgenreNames((prev) => ({ ...prev, [genre.id]: e.target.value }))
                      }
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#1c1c1c',
                        color: '#fff',
                        border: '1px solid #333',
                        borderRadius: '3px',
                        fontSize: '13px',
                        flex: 1
                      }}
                    />
                    <button
                      onClick={() => handleAddSubgenre(genre.id)}
                      style={{
                        padding: '4px 10px',
                        backgroundColor: '#333',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '3px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      + Add Subgenre
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SubgenreAddKeywordForm: React.FC<{
  onAdd: (term: string, weight: number) => Promise<void>;
}> = ({ onAdd }) => {
  const [term, setTerm] = useState('');
  const [weight, setWeight] = useState(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim()) return;
    await onAdd(term.trim().toLowerCase(), weight);
    setTerm('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '6px' }}>
      <input
        type="text"
        placeholder="Keyword term..."
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        style={{
          padding: '2px 6px',
          backgroundColor: '#222',
          color: '#fff',
          border: '1px solid #444',
          borderRadius: '3px',
          fontSize: '11px',
          flex: 1
        }}
      />
      <select
        value={weight}
        onChange={(e) => setWeight(Number(e.target.value))}
        style={{
          padding: '2px 4px',
          backgroundColor: '#222',
          color: '#fff',
          border: '1px solid #444',
          borderRadius: '3px',
          fontSize: '11px'
        }}
      >
        <option value={1}>weight 1</option>
        <option value={2}>weight 2</option>
        <option value={3}>weight 3</option>
      </select>
      <button
        type="submit"
        style={{
          padding: '2px 8px',
          backgroundColor: '#444',
          color: '#fff',
          border: 'none',
          borderRadius: '3px',
          fontSize: '11px',
          cursor: 'pointer'
        }}
      >
        Add
      </button>
    </form>
  );
};

const SubgenreAddExcludeForm: React.FC<{
  onAdd: (term: string) => Promise<void>;
}> = ({ onAdd }) => {
  const [term, setTerm] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim()) return;
    await onAdd(term.trim().toLowerCase());
    setTerm('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '6px' }}>
      <input
        type="text"
        placeholder="Exclude term..."
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        style={{
          padding: '2px 6px',
          backgroundColor: '#222',
          color: '#fff',
          border: '1px solid #444',
          borderRadius: '3px',
          fontSize: '11px',
          flex: 1
        }}
      />
      <button
        type="submit"
        style={{
          padding: '2px 8px',
          backgroundColor: '#444',
          color: '#fff',
          border: 'none',
          borderRadius: '3px',
          fontSize: '11px',
          cursor: 'pointer'
        }}
      >
        Add Exclude
      </button>
    </form>
  );
};
