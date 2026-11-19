import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { PopupApp } from '../../src/popup/PopupApp';
import { openCorrectionModal } from '../../src/content/cardActions/correctionModal';
import { DEFAULT_SETTINGS } from '../../src/core/defaults';
import { VideoMeta } from '../../src/core/types';

describe('Popup UI', () => {
  it('renders master and shorts toggles and reacts to clicks', async () => {
    render(<PopupApp />);

    // Wait for initial async state load
    const masterBtn = await screen.findByTestId('popup-master-toggle');
    expect(masterBtn).toHaveTextContent('ON');

    fireEvent.click(masterBtn);
    expect(masterBtn).toHaveTextContent('OFF');

    const shortsBtn = screen.getByTestId('popup-shorts-toggle');
    expect(shortsBtn).toHaveTextContent('BLOCKED');

    fireEvent.click(shortsBtn);
    expect(shortsBtn).toHaveTextContent('OFF');
  });

  it('triggers chrome openOptionsPage on options button click', async () => {
    render(<PopupApp />);
    const optionsBtn = await screen.findByTestId('popup-open-options-btn');
    fireEvent.click(optionsBtn);

    expect(chrome.runtime.openOptionsPage).toHaveBeenCalled();
  });
});

describe('Correction Modal ("Wrong genre?")', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    document.body.innerHTML = '';
  });

  it('opens correction modal and saves override', async () => {
    const meta: VideoMeta = {
      videoId: 'vWrong123',
      title: 'Misclassified Video Title',
      channel: { channelId: 'chW', name: 'Channel W' },
      durationSec: 600,
      isShort: false,
      isLive: false,
      isUpcoming: false,
      watchedPct: null
    };

    const onApplied = vi.fn();
    openCorrectionModal(meta, DEFAULT_SETTINGS, onApplied);

    const modal = document.getElementById('yfc-correction-modal');
    expect(modal).not.toBeNull();
    expect(modal?.textContent).toContain('Correct Genre / Type Classification');

    const saveBtn = document.getElementById('yfc-correction-save');
    expect(saveBtn).not.toBeNull();
    fireEvent.click(saveBtn!);

    // Wait for async patch
    await new Promise((r) => setTimeout(r, 20));

    expect(onApplied).toHaveBeenCalledTimes(1);
    expect(document.getElementById('yfc-correction-modal')).toBeNull();
  });
});
