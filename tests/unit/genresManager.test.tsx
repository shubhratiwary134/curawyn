import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { GenresManager } from '../../src/options/components/GenresManager';
import { DEFAULT_SETTINGS } from '../../src/core/defaults';
import { Settings } from '../../src/core/types';

describe('GenresManager UI', () => {
  it('renders seed genres in the list', () => {
    const handleUpdate = vi.fn().mockResolvedValue(undefined);
    render(<GenresManager settings={DEFAULT_SETTINGS} onUpdateSettings={handleUpdate} />);

    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('Programming and Software')).toBeInTheDocument();
  });

  it('toggles genre enabled state and calls onUpdateSettings', () => {
    const handleUpdate = vi.fn().mockImplementation((updater) => {
      const next = updater(DEFAULT_SETTINGS);
      expect(next.genres['tech'].enabled).toBe(false);
      return Promise.resolve();
    });

    render(<GenresManager settings={DEFAULT_SETTINGS} onUpdateSettings={handleUpdate} />);
    const enableCheckbox = screen.getByTestId('genre-enable-toggle-tech');
    expect(enableCheckbox).toBeChecked();

    fireEvent.click(enableCheckbox);
    expect(handleUpdate).toHaveBeenCalledTimes(1);
  });

  it('visually indicates and overrides enabled when genre is blocked', () => {
    const blockedSettings: Settings = {
      ...DEFAULT_SETTINGS,
      genres: {
        ...DEFAULT_SETTINGS.genres,
        tech: {
          ...DEFAULT_SETTINGS.genres['tech'],
          blocked: true
        }
      }
    };
    const handleUpdate = vi.fn().mockResolvedValue(undefined);

    render(<GenresManager settings={blockedSettings} onUpdateSettings={handleUpdate} />);
    expect(screen.getByTestId('genre-blocked-badge-tech')).toBeInTheDocument();

    const enableCheckbox = screen.getByTestId('genre-enable-toggle-tech');
    expect(enableCheckbox).toBeDisabled();
  });

  it('expands genre to show subgenres and keyword editor', () => {
    const handleUpdate = vi.fn().mockResolvedValue(undefined);
    render(<GenresManager settings={DEFAULT_SETTINGS} onUpdateSettings={handleUpdate} />);

    // Click expand for programming
    const expandBtn = screen.getByLabelText(/toggle expand programming and software/i);
    fireEvent.click(expandBtn);

    // Subgenre 'Web Development' is now visible
    expect(screen.getByText('Web Development')).toBeInTheDocument();

    // Click Keywords button for Web Development
    const keywordsBtn = screen.getByRole('button', { name: /keywords/i });
    fireEvent.click(keywordsBtn);

    expect(screen.getByTestId('keyword-editor-prog_web')).toBeInTheDocument();
    expect(screen.getByText(/include keywords/i)).toBeInTheDocument();
  });

  it('shows parent blocked warning on subgenre if parent genre is blocked', () => {
    const blockedSettings: Settings = {
      ...DEFAULT_SETTINGS,
      genres: {
        ...DEFAULT_SETTINGS.genres,
        programming: {
          ...DEFAULT_SETTINGS.genres['programming'],
          blocked: true
        }
      }
    };
    const handleUpdate = vi.fn().mockResolvedValue(undefined);

    render(<GenresManager settings={blockedSettings} onUpdateSettings={handleUpdate} />);
    const expandBtn = screen.getByLabelText(/toggle expand programming and software/i);
    fireEvent.click(expandBtn);

    expect(screen.getByTestId('subgenre-parent-blocked-prog_web')).toBeInTheDocument();
  });
});
