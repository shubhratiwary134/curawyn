import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { DurationAndTypesManager } from '../../src/options/components/DurationAndTypesManager';
import { DEFAULT_SETTINGS } from '../../src/core/defaults';
import { Settings } from '../../src/core/types';

describe('DurationAndTypesManager UI', () => {
  it('renders global defaults inputs and chips', () => {
    const handleUpdate = vi.fn().mockResolvedValue(undefined);
    render(<DurationAndTypesManager settings={DEFAULT_SETTINGS} onUpdateSettings={handleUpdate} />);

    expect(screen.getByTestId('global-duration-types-card')).toBeInTheDocument();
    expect(screen.getByTestId('global-min-duration-input')).toHaveValue(5); // 300s / 60
    expect(screen.getByTestId('global-max-duration-input')).toHaveValue(60); // 3600s / 60
    expect(screen.getByTestId('global-type-chip-tutorial')).toBeInTheDocument();
  });

  it('updates global duration on input change', () => {
    const handleUpdate = vi.fn().mockImplementation((updater) => {
      const next = updater(DEFAULT_SETTINGS);
      expect(next.global.duration.minSec).toBe(600); // 10 min * 60
      return Promise.resolve();
    });

    render(<DurationAndTypesManager settings={DEFAULT_SETTINGS} onUpdateSettings={handleUpdate} />);
    const minInput = screen.getByTestId('global-min-duration-input');
    fireEvent.change(minInput, { target: { value: '10' } });

    expect(handleUpdate).toHaveBeenCalledTimes(1);
  });

  it('displays validation error if global min > max', () => {
    const invalidSettings: Settings = {
      ...DEFAULT_SETTINGS,
      global: {
        ...DEFAULT_SETTINGS.global,
        duration: { minSec: 7200, maxSec: 3600 }
      }
    };
    const handleUpdate = vi.fn().mockResolvedValue(undefined);

    render(<DurationAndTypesManager settings={invalidSettings} onUpdateSettings={handleUpdate} />);
    expect(screen.getByTestId('global-duration-error')).toBeInTheDocument();
  });

  it('displays effective duration and resolves inheritance correctly', () => {
    const handleUpdate = vi.fn().mockResolvedValue(undefined);
    render(<DurationAndTypesManager settings={DEFAULT_SETTINGS} onUpdateSettings={handleUpdate} />);

    const preview = screen.getByTestId('effective-duration-preview');
    expect(preview).toHaveTextContent(/Min: 5m/i);
    expect(preview).toHaveTextContent(/from global/i);
    expect(preview).toHaveTextContent(/Max: 60m/i);
  });

  it('shows error banner in effective preview when override makes min > max', () => {
    const handleUpdate = vi.fn().mockResolvedValue(undefined);
    // Tech genre with min 90 min (exceeds global 60 min max)
    const customSettings: Settings = {
      ...DEFAULT_SETTINGS,
      genres: {
        ...DEFAULT_SETTINGS.genres,
        tech: {
          ...DEFAULT_SETTINGS.genres['tech'],
          duration: { minSec: 5400, maxSec: null }
        }
      }
    };

    render(<DurationAndTypesManager settings={customSettings} onUpdateSettings={handleUpdate} />);
    expect(screen.getByTestId('effective-duration-error')).toBeInTheDocument();
  });

  it('reflects inherited vs block all content types mode', () => {
    const handleUpdate = vi.fn().mockResolvedValue(undefined);
    render(<DurationAndTypesManager settings={DEFAULT_SETTINGS} onUpdateSettings={handleUpdate} />);

    const inheritRadio = screen.getByTestId('ct-mode-inherit');
    expect(inheritRadio).toBeChecked();

    const typesPreview = screen.getByTestId('effective-types-preview');
    expect(typesPreview).toHaveTextContent(/inherited from global/i);
  });
});
