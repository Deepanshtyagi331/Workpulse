import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDate,
  capitalize,
  truncate,
  formatRelativeTime,
  formatFileSize,
} from './formatters.js';

test('formatDate handles null and valid ISO dates', () => {
  assert.equal(formatDate(null), 'N/A');
  assert.equal(formatDate(''), 'N/A');
  const result = formatDate('2026-09-10T12:00:00Z');
  assert.ok(result.includes('2026'));
  assert.ok(result.includes('Sep'));
});

test('capitalize capitalizes the first character', () => {
  assert.equal(capitalize('pending'), 'Pending');
  assert.equal(capitalize('admin'), 'Admin');
  assert.equal(capitalize(''), '');
});

test('truncate truncates text longer than limit', () => {
  assert.equal(truncate('Short text', 20), 'Short text');
  assert.equal(truncate('A very long task description that exceeds limit', 10), 'A very lon...');
  assert.equal(truncate(null), null);
});

test('formatFileSize converts bytes to KB and MB', () => {
  assert.equal(formatFileSize(0), '0 B');
  assert.equal(formatFileSize(500), '500 B');
  assert.equal(formatFileSize(1024), '1.0 KB');
  assert.equal(formatFileSize(1048576), '1.0 MB');
  assert.equal(formatFileSize(-5), '0 B');
});

test('formatRelativeTime returns user-friendly relative strings', () => {
  const now = new Date();
  assert.equal(formatRelativeTime(now.toISOString()), 'Just now');
  
  const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  assert.equal(formatRelativeTime(tenMinsAgo), '10m ago');

  const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
  assert.equal(formatRelativeTime(twoHoursAgo), '2h ago');
});
