import React, { useState } from 'react';
import { Settings } from '../../core/types';

interface Props {
  settings: Settings;
  onUpdateSettings: (updater: (prev: Settings) => Settings) => Promise<void>;
}

export const BlacklistManager: React.FC<Props> = ({ settings, onUpdateSettings }) => {
  const [filterText, setFilterText] = useState('');
  const [manualVideoId, setManualVideoId] = useState('');
  const [manualVideoTitle, setManualVideoTitle] = useState('');
  const [manualChannelId, setManualChannelId] = useState('');
  const [manualChannelName, setManualChannelName] = useState('');

  const bl = settings.blacklist;
  const videoEntries = Object.entries(bl.videos);
  const channelEntries = Object.entries(bl.channels);

  const filteredVideos = videoEntries.filter(
    ([id, item]) =>
      id.toLowerCase().includes(filterText.toLowerCase()) ||
      item.title.toLowerCase().includes(filterText.toLowerCase())
  );

  const filteredChannels = channelEntries.filter(
    ([id, item]) =>
      id.toLowerCase().includes(filterText.toLowerCase()) ||
      (item.handle && item.handle.toLowerCase().includes(filterText.toLowerCase())) ||
      item.name.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleUnblockVideo = async (videoId: string) => {
    await onUpdateSettings((prev) => {
      const nextV = { ...prev.blacklist.videos };
      delete nextV[videoId];
      return {
        ...prev,
        blacklist: { ...prev.blacklist, videos: nextV }
      };
    });
  };

  const handleUnblockChannel = async (channelKey: string) => {
    await onUpdateSettings((prev) => {
      const nextC = { ...prev.blacklist.channels };
      delete nextC[channelKey];
      return {
        ...prev,
        blacklist: { ...prev.blacklist, channels: nextC }
      };
    });
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualVideoId.trim()) return;
    const id = manualVideoId.trim();
    const title = manualVideoTitle.trim() || `Video ${id}`;
    await onUpdateSettings((prev) => ({
      ...prev,
      blacklist: {
        ...prev.blacklist,
        videos: {
          ...prev.blacklist.videos,
          [id]: { title, addedAt: Date.now() }
        }
      }
    }));
    setManualVideoId('');
    setManualVideoTitle('');
  };

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualChannelId.trim()) return;
    const key = manualChannelId.trim();
    const name = manualChannelName.trim() || key;
    await onUpdateSettings((prev) => ({
      ...prev,
      blacklist: {
        ...prev.blacklist,
        channels: {
          ...prev.blacklist.channels,
          [key]: {
            channelId: key,
            handle: key.startsWith('@') ? key.slice(1) : undefined,
            name,
            addedAt: Date.now()
          }
        }
      }
    }));
    setManualChannelId('');
    setManualChannelName('');
  };

  const handleToggleApplyInSearch = async (checked: boolean) => {
    await onUpdateSettings((prev) => ({
      ...prev,
      blacklist: {
        ...prev.blacklist,
        applyInSearch: checked
      }
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ margin: '0 0 6px 0' }}>Blacklist Management</h2>
        <p style={{ margin: '0 0 16px 0', color: '#aaa', fontSize: '14px' }}>
          Items on the blacklist are never shown on any filtered surface, and accessing them directly
          displays the blocked interstitial.
        </p>

        {/* Apply in search toggle */}
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#1c1c1c',
            border: '1px solid #333',
            padding: '8px 14px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          <input
            type="checkbox"
            data-testid="toggle-apply-in-search"
            checked={bl.applyInSearch}
            onChange={(e) => handleToggleApplyInSearch(e.target.checked)}
          />
          Apply Blacklist in Search Results (default OFF)
        </label>
      </div>

      {/* Search box */}
      <div>
        <input
          type="text"
          placeholder="Filter blacklisted videos or channels..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '8px 12px',
            backgroundColor: '#1f1f1f',
            color: '#fff',
            border: '1px solid #333',
            borderRadius: '4px',
            fontSize: '13px'
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Blocked Channels Section */}
        <div
          data-testid="blocked-channels-card"
          style={{
            backgroundColor: '#181818',
            border: '1px solid #2e2e2e',
            borderRadius: '8px',
            padding: '16px'
          }}
        >
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#ff6666' }}>
            Blocked Channels ({channelEntries.length})
          </h3>

          {/* Add channel form */}
          <form onSubmit={handleAddChannel} style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
            <input
              type="text"
              placeholder="Channel ID or @handle..."
              value={manualChannelId}
              onChange={(e) => setManualChannelId(e.target.value)}
              style={{
                flex: 1,
                padding: '6px 8px',
                backgroundColor: '#222',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: '3px',
                fontSize: '12px'
              }}
            />
            <input
              type="text"
              placeholder="Name (optional)"
              value={manualChannelName}
              onChange={(e) => setManualChannelName(e.target.value)}
              style={{
                flex: 1,
                padding: '6px 8px',
                backgroundColor: '#222',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: '3px',
                fontSize: '12px'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '6px 12px',
                backgroundColor: '#cc0000',
                color: '#fff',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              Block
            </button>
          </form>

          {/* Channel list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
            {filteredChannels.length === 0 ? (
              <div style={{ color: '#777', fontSize: '13px', padding: '12px 0' }}>
                No blocked channels found.
              </div>
            ) : (
              filteredChannels.map(([key, ch]) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: '#221111',
                    border: '1px solid #3d1a1a',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}
                >
                  <div>
                    <strong style={{ color: '#ff8888' }}>{ch.name}</strong>
                    <div style={{ fontSize: '11px', color: '#888' }}>
                      {ch.handle ? `@${ch.handle}` : ch.channelId}
                    </div>
                  </div>
                  <button
                    data-testid={`unblock-channel-${key}`}
                    onClick={() => handleUnblockChannel(key)}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: '#333',
                      color: '#fff',
                      border: '1px solid #555',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Unblock
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Blocked Videos Section */}
        <div
          data-testid="blocked-videos-card"
          style={{
            backgroundColor: '#181818',
            border: '1px solid #2e2e2e',
            borderRadius: '8px',
            padding: '16px'
          }}
        >
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#ff6666' }}>
            Blocked Videos ({videoEntries.length})
          </h3>

          {/* Add video form */}
          <form onSubmit={handleAddVideo} style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
            <input
              type="text"
              placeholder="Video ID (e.g. dQw4w9WgXcQ)..."
              value={manualVideoId}
              onChange={(e) => setManualVideoId(e.target.value)}
              style={{
                flex: 1,
                padding: '6px 8px',
                backgroundColor: '#222',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: '3px',
                fontSize: '12px'
              }}
            />
            <input
              type="text"
              placeholder="Title..."
              value={manualVideoTitle}
              onChange={(e) => setManualVideoTitle(e.target.value)}
              style={{
                flex: 1,
                padding: '6px 8px',
                backgroundColor: '#222',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: '3px',
                fontSize: '12px'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '6px 12px',
                backgroundColor: '#cc0000',
                color: '#fff',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              Block
            </button>
          </form>

          {/* Video list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
            {filteredVideos.length === 0 ? (
              <div style={{ color: '#777', fontSize: '13px', padding: '12px 0' }}>
                No blocked videos found.
              </div>
            ) : (
              filteredVideos.map(([id, vid]) => (
                <div
                  key={id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: '#221111',
                    border: '1px solid #3d1a1a',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <div style={{ color: '#ff8888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {vid.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#888' }}>ID: {id}</div>
                  </div>
                  <button
                    data-testid={`unblock-video-${id}`}
                    onClick={() => handleUnblockVideo(id)}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: '#333',
                      color: '#fff',
                      border: '1px solid #555',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Unblock
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
