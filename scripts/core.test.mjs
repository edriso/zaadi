import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  approximateCollection,
  chooseByTimes,
  suggestion,
  parsePreferences,
  clampZoom,
  swipeDirection,
  boundedIndex,
  keyboardAction,
  referenceNumber,
} from '../lib/core.mjs';
import {
  resolveRefs,
  validateCount,
  validateSource,
  buildContent,
} from './content.mjs';
test('source corpus and every occasion/count validate', () => buildContent());
test('clock fallback has explicit non-prayer windows', () => {
  assert.equal(approximateCollection(3), 'general');
  assert.equal(approximateCollection(4), 'morning');
  assert.equal(approximateCollection(12), 'general');
  assert.equal(approximateCollection(15), 'evening');
  assert.equal(approximateCollection(21), 'general');
});
test('computed Fajr opens morning exactly at its boundary', () => {
  const at = (hour) => new Date(`2026-09-05T${hour}:00:00Z`),
    times = { fajr: at('04'), dhuhr: at('12'), asr: at('15'), isha: at('20') };
  assert.equal(chooseByTimes(at('03'), times), 'general');
  assert.equal(chooseByTimes(at('04'), times), 'morning');
  assert.equal(chooseByTimes(at('12'), times), 'general');
  assert.equal(chooseByTimes(at('15'), times), 'evening');
  assert.equal(chooseByTimes(at('20'), times), 'general');
  assert.equal(
    chooseByTimes(at('15'), { ...times, fajr: new Date(NaN) }),
    null,
  );
});
test('city selection computes without a location request or remote API', () => {
  const result = suggestion(new Date('2026-09-05T04:00:00Z'), {
    city: 'cairo',
    method: 'Egyptian',
    hanafi: false,
  });
  assert.equal(result.id, 'morning');
  assert.equal(result.approximate, false);
  const fallback = suggestion(new Date(), {
    city: 'invalid',
    method: '',
    hanafi: false,
  });
  assert.equal(fallback.approximate, true);
});
test('malformed stored values cannot break reading or bypass size bounds', () => {
  assert.equal(parsePreferences('{').zoom, 1);
  assert.equal(parsePreferences('null').zoom, 1);
  const value = parsePreferences(
    JSON.stringify({
      version: 1,
      zoom: 50,
      city: 'fake',
      method: 'fake',
      hanafi: 'yes',
    }),
  );
  assert.deepEqual(value, { zoom: 1.6, city: '', method: '', hanafi: false });
  assert.equal(clampZoom(-1), 0.8);
  assert.equal(clampZoom(Infinity), 1);
  assert.equal(clampZoom(1.299999), 1.3);
});
test('RTL horizontal swipes match the labelled direction', () => {
  const start = { x: 100, y: 100, time: 0 };
  assert.equal(swipeDirection(start, { x: 180, y: 105, time: 300 }), 1);
  assert.equal(swipeDirection(start, { x: 20, y: 105, time: 300 }), -1);
});
test('scrolls, taps, canceled, slow and multi-finger gestures do not navigate', () => {
  const start = { x: 100, y: 100, time: 0 };
  for (const end of [
    { x: 110, y: 100, time: 100 },
    { x: 180, y: 220, time: 300 },
    { x: 190, y: 100, time: 1000 },
  ])
    assert.equal(swipeDirection(start, end), 0);
  assert.equal(
    swipeDirection(
      { ...start, multitouch: true },
      { x: 190, y: 100, time: 300 },
    ),
    0,
  );
  assert.equal(
    swipeDirection({ ...start, canceled: true }, { x: 190, y: 100, time: 300 }),
    0,
  );
});
test('navigation does not wrap at either end', () => {
  assert.equal(boundedIndex(0, -1, 6), 0);
  assert.equal(boundedIndex(5, 1, 6), 5);
  assert.equal(boundedIndex(3, -1, 6), 2);
});
test('a narration suffix survives visible formatting', () =>
  assert.equal(referenceNumber('597a'), '٥٩٧a'));
test('Quran ranges preserve source strings and reject unknown references', () => {
  assert.deepEqual(
    resolveRefs(['112:1-2'], { '112:1': 'first', '112:2': 'second' }).map(
      (v) => v.text,
    ),
    ['first', 'second'],
  );
  assert.throws(() => resolveRefs(['115:1'], {}));
  assert.throws(() => resolveRefs(['112:4-1'], {}));
});
test('unrestricted remembrance cannot acquire a prescribed target', () => {
  assert.doesNotThrow(() => validateCount(null, 'unrestricted'));
  assert.throws(() => validateCount(3, 'unrestricted'));
  assert.throws(() => validateCount(0, 'explicit'));
  assert.throws(() => validateCount(3, 'single-recitation'));
});

test('keyboard navigation works from page controls without stealing activation or scroll', () => {
  assert.equal(keyboardAction({ key: 'ArrowLeft' }), 'next');
  assert.equal(keyboardAction({ key: 'ArrowRight' }), 'previous');
  for (const key of [
    'Enter',
    ' ',
    'Home',
    'End',
    'ArrowUp',
    'ArrowDown',
    'Tab',
  ])
    assert.equal(keyboardAction({ key }), null);
  assert.equal(keyboardAction({ key: 'Enter' }, { reading: true }), 'count');
  assert.equal(keyboardAction({ key: 'Home' }, { reading: true }), 'first');
  assert.equal(keyboardAction({ key: 'End' }, { reading: true }), 'last');
});
test('keyboard shortcuts respect dialogs, editing, selection, modifiers and held keys', () => {
  assert.equal(keyboardAction({ key: 'ArrowLeft' }, { blocked: true }), null);
  for (const flag of [
    'altKey',
    'ctrlKey',
    'metaKey',
    'shiftKey',
    'repeat',
    'isComposing',
    'defaultPrevented',
  ]) {
    assert.equal(keyboardAction({ key: 'ArrowLeft', [flag]: true }), null);
    assert.equal(
      keyboardAction({ key: 'Enter', [flag]: true }, { reading: true }),
      null,
    );
  }
});

test('exceptional source links retain exact narration identity and trusted destination', () => {
  assert.doesNotThrow(() =>
    validateSource({
      source: 'muslim:2709a',
      url: 'https://sunnah.com/muslim:2708b',
    }),
  );
  assert.doesNotThrow(() =>
    validateSource({
      source: 'targhib:661',
      url: 'https://dorar.net/h/g1qjT5BF',
    }),
  );
  assert.throws(() =>
    validateSource({ source: 'targhib:661', url: 'https://example.com/' }),
  );
  assert.throws(() =>
    validateSource({
      source: 'bukhari:6306',
      url: 'https://sunnah.com/bukhari:6307',
    }),
  );
});
