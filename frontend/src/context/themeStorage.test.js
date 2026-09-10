import test from 'node:test';
import assert from 'node:assert/strict';
import { THEME_STORAGE_KEY, getStoredTheme } from './themeStorage.js';

test('getStoredTheme defaults to light when localStorage is empty', () => {
  // Mock localStorage
  globalThis.localStorage = {
    getItem: () => null,
    setItem: () => {},
  };
  assert.equal(getStoredTheme(), 'light');
});

test('getStoredTheme returns dark when localStorage has dark', () => {
  globalThis.localStorage = {
    getItem: (key) => (key === THEME_STORAGE_KEY ? 'dark' : null),
    setItem: () => {},
  };
  assert.equal(getStoredTheme(), 'dark');
});

test('getStoredTheme falls back to light on invalid value', () => {
  globalThis.localStorage = {
    getItem: () => 'invalid-theme-value',
    setItem: () => {},
  };
  assert.equal(getStoredTheme(), 'light');
});
