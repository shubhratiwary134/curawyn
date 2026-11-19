import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { AdvancedManager } from '../../src/options/components/AdvancedManager';
import { DEFAULT_SETTINGS } from '../../src/core/defaults';

describe('AdvancedManager', () => {
  it('updates surface filtering mode in settings', () => {
    const handleUpdate = vi.fn().mockImplementation((updater) => {
      const next = updater(DEFAULT_SETTINGS);
      expect(next.surfaces.watch).toBe('blacklistOnly');
      return Promise.resolve();
    });

    render(<AdvancedManager settings={DEFAULT_SETTINGS} onUpdateSettings={handleUpdate} />);

    const selectWatch = screen.getByTestId('surface-mode-select-watch');
    fireEvent.change(selectWatch, { target: { value: 'blacklistOnly' } });

    expect(handleUpdate).toHaveBeenCalledTimes(1);
  });

  it('updates unclassified policy between hide and show', () => {
    const handleUpdate = vi.fn().mockImplementation((updater) => {
      const next = updater(DEFAULT_SETTINGS);
      expect(next.unclassified.policy).toBe('show');
      return Promise.resolve();
    });

    render(<AdvancedManager settings={DEFAULT_SETTINGS} onUpdateSettings={handleUpdate} />);
    const showRadio = screen.getByTestId('policy-show');
    fireEvent.click(showRadio);

    expect(handleUpdate).toHaveBeenCalledTimes(1);
  });

  it('imports valid JSON file losslessly', async () => {
    const customSettings = {
      ...DEFAULT_SETTINGS,
      debug: true,
      unclassified: { ...DEFAULT_SETTINGS.unclassified, confidenceThreshold: 0.8 }
    };

    const handleUpdate = vi.fn().mockImplementation((updater) => {
      const next = updater(DEFAULT_SETTINGS);
      expect(next.debug).toBe(true);
      expect(next.unclassified.confidenceThreshold).toBe(0.8);
      return Promise.resolve();
    });

    render(<AdvancedManager settings={DEFAULT_SETTINGS} onUpdateSettings={handleUpdate} />);

    const file = new File([JSON.stringify(customSettings)], 'settings.json', {
      type: 'application/json'
    });
    const fileInput = screen.getByTestId('import-file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId('import-success-banner')).toBeInTheDocument();
    });
    expect(handleUpdate).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid JSON file with validation error and without side effects', async () => {
    const handleUpdate = vi.fn().mockResolvedValue(undefined);
    render(<AdvancedManager settings={DEFAULT_SETTINGS} onUpdateSettings={handleUpdate} />);

    const corrupt = {
      schemaVersion: 1,
      diversity: 'not an object' // invalid schema
    };

    const file = new File([JSON.stringify(corrupt)], 'invalid.json', {
      type: 'application/json'
    });
    const fileInput = screen.getByTestId('import-file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId('import-error-banner')).toBeInTheDocument();
    });
    expect(handleUpdate).not.toHaveBeenCalled();
  });
});
