import { describe, it, expect } from 'vitest';

describe('Scaffold', () => {
  it('loads test environment correctly', () => {
    expect(chrome).toBeDefined();
    expect(chrome.storage).toBeDefined();
  });
});
