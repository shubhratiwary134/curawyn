import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { extractCardMeta, parseDurationToSeconds, extractVideoId } from '../../src/content/extractCard';
import { detectSurface } from '../../src/content/surfaces';

describe('extractCard unit helpers', () => {
  it('parses duration strings correctly', () => {
    expect(parseDurationToSeconds('03:33')).toBe(213);
    expect(parseDurationToSeconds('12:45')).toBe(765);
    expect(parseDurationToSeconds('1:15:02')).toBe(4502);
    expect(parseDurationToSeconds('invalid')).toBeNull();
  });

  it('extracts videoId correctly from various URL patterns', () => {
    expect(extractVideoId('/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractVideoId('/shorts/abc123DEF45')).toBe('abc123DEF45');
    expect(extractVideoId('https://www.youtube.com/watch?v=kffacxfA7G4&t=10s')).toBe('kffacxfA7G4');
  });

  it('detects surfaces from URLs', () => {
    expect(detectSurface('https://www.youtube.com/')).toBe('home');
    expect(detectSurface('https://www.youtube.com/watch?v=123')).toBe('watch');
    expect(detectSurface('https://www.youtube.com/feed/subscriptions')).toBe('subscriptions');
    expect(detectSurface('https://www.youtube.com/feed/trending')).toBe('explore');
    expect(detectSurface('https://www.youtube.com/results?search_query=test')).toBe('search');
    expect(detectSurface('https://www.youtube.com/@mkbhd')).toBe('channel');
    expect(detectSurface('https://www.youtube.com/playlist?list=LL')).toBe('library');
  });
});

describe('HTML Fixture Extractions', () => {
  const loadFixture = (filename: string): HTMLElement => {
    const filePath = path.resolve(__dirname, '../fixtures/html', filename);
    const html = fs.readFileSync(filePath, 'utf-8');
    const container = document.createElement('div');
    container.innerHTML = html.trim();
    return container.firstElementChild as HTMLElement;
  };

  it('extracts rich-item-renderer correctly', () => {
    const el = loadFixture('richItemRenderer.html');
    const meta = extractCardMeta(el);
    expect(meta).not.toBeNull();
    expect(meta?.videoId).toBe('dQw4w9WgXcQ');
    expect(meta?.title).toBe('Rick Astley - Never Gonna Give You Up');
    expect(meta?.channel?.handle).toBe('RickAstleyYT');
    expect(meta?.channel?.name).toBe('Rick Astley');
    expect(meta?.durationSec).toBe(213);
    expect(meta?.watchedPct).toBe(45);
    expect(meta?.isShort).toBe(false);
    expect(meta?.isLive).toBe(false);
  });

  it('extracts compact-video-renderer correctly', () => {
    const el = loadFixture('compactVideoRenderer.html');
    const meta = extractCardMeta(el);
    expect(meta).not.toBeNull();
    expect(meta?.videoId).toBe('kffacxfA7G4');
    expect(meta?.title).toBe('Baby Shark Dance | Sing and Dance!');
    expect(meta?.channel?.channelId).toBe('UCbCmjCuTUZos62426U6951g');
    expect(meta?.durationSec).toBe(765);
    expect(meta?.isShort).toBe(false);
  });

  it('extracts yt-lockup-view-model correctly', () => {
    const el = loadFixture('lockupViewModel.html');
    const meta = extractCardMeta(el);
    expect(meta).not.toBeNull();
    expect(meta?.videoId).toBe('9bZkp7q19f0');
    expect(meta?.title).toBe('PSY - GANGNAM STYLE(강남스타일) M/V');
    expect(meta?.channel?.handle).toBe('officialpsy');
    expect(meta?.durationSec).toBe(4502);
  });

  it('extracts shortsCard correctly', () => {
    const el = loadFixture('shortsCard.html');
    const meta = extractCardMeta(el);
    expect(meta).not.toBeNull();
    expect(meta?.videoId).toBe('abc123DEF45');
    expect(meta?.isShort).toBe(true);
  });

  it('extracts liveCard correctly', () => {
    const el = loadFixture('liveCard.html');
    const meta = extractCardMeta(el);
    expect(meta).not.toBeNull();
    expect(meta?.videoId).toBe('liveVid1234');
    expect(meta?.isLive).toBe(true);
    expect(meta?.durationSec).toBeNull();
  });
});
