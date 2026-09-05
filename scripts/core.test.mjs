import { runInNewContext } from 'node:vm';
import { bootstrapAppearance, STORAGE } from '../lib/appearance.mjs';
import { newReading, readingReducer, isReadingTap } from '../lib/reading.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  approximateCollection,
  chooseByTimes,
  suggestion,
  parsePreferences,
  clampZoom,
  defaultPreferences,
  swipeDirection,
  boundedIndex,
  keyboardAction,
  referenceNumber,
} from '../lib/core.mjs';
import {
  resolveRefs,
  validateCount,
  validateSource,
  validatePlacement,
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
  assert.deepEqual(value, {
    zoom: 1.6,
    city: '',
    method: '',
    hanafi: false,
    theme: 'light',
    background: 'plain',
    minimal: false,
  });
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
  assert.equal(keyboardAction({ key: 'ArrowRight' }), 'next');
  assert.equal(keyboardAction({ key: 'ArrowLeft' }), 'previous');
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

test('old and invalid preferences keep light mode; chosen dark/system themes survive', () => {
  for (const theme of ['light', 'dark', 'system'])
    assert.equal(
      parsePreferences(JSON.stringify({ version: 1, theme })).theme,
      theme,
    );
  assert.equal(
    parsePreferences(JSON.stringify({ version: 1, theme: 'invalid' })).theme,
    'light',
  );
  assert.equal(parsePreferences(JSON.stringify({ version: 1 })).theme, 'light');
});

test('reading waits for all repetitions, advances once, and undo reverses the move', () => {
  const items = [
    { id: 'three', count: 3 },
    { id: 'one', count: 1 },
  ];
  let state = newReading();
  for (let count = 1; count <= 3; count++) {
    state = readingReducer(state, { type: 'read', items });
    assert.equal(state.counts.three, count);
    assert.equal(state.index, count === 3 ? 1 : 0);
  }
  state = readingReducer(state, { type: 'undo' });
  assert.equal(state.index, 0);
  assert.equal(state.counts.three, 2);
  state = readingReducer(state, { type: 'read', items });
  state = readingReducer(state, { type: 'read', items });
  assert.equal(state.index, 1);
  assert.equal(state.counts.one, 1);
  assert.deepEqual(readingReducer(state, { type: 'read', items }), state);
});
test('navigation and unrestricted text do not invent repetitions; undo works across cards', () => {
  const items = [
    { id: 'one', count: 1 },
    { id: 'free', count: null },
  ];
  const skipped = readingReducer(newReading(), {
    type: 'navigate',
    index: 1,
    items,
  });
  assert.deepEqual(skipped.counts, {});
  assert.deepEqual(readingReducer(skipped, { type: 'read', items }).counts, {});
  const counted = readingReducer(newReading(), { type: 'read', items });
  assert.equal(counted.index, 1);
  const undone = readingReducer(counted, { type: 'undo' });
  assert.equal(undone.index, 0);
  assert.equal(undone.counts.one, 0);
  assert.deepEqual(readingReducer(counted, { type: 'reset' }), newReading());
});
test('text taps exclude drags, long presses, scrolls, cancellation and multitouch', () => {
  const start = { x: 10, y: 10, time: 0 },
    end = { x: 11, y: 12, time: 200 };
  assert.equal(isReadingTap(start, end), true);
  for (const flag of ['moved', 'canceled', 'multitouch'])
    assert.equal(isReadingTap({ ...start, [flag]: true }, end), false);
  assert.equal(isReadingTap(start, { ...end, x: 70 }), false);
  assert.equal(isReadingTap(start, { ...end, time: 600 }), false);
  assert.equal(isReadingTap(null, end), false);
});

function appearanceHarness({ stored, denied = false } = {}) {
  const dataset = {},
    events = new Map();
  let timeout, resolveFonts;
  const loaded = new Promise((resolve) => {
    resolveFonts = resolve;
  });
  const context = {
    document: {
      documentElement: { dataset },
      fonts: { load: () => loaded, ready: Promise.resolve() },
    },
    localStorage: {
      getItem: () => {
        if (denied) throw new Error('Storage denied');
        return stored;
      },
    },
    matchMedia: () => ({ matches: true }),
    window: {
      addEventListener: (type, handler) => events.set(type, handler),
      removeEventListener: (type) => events.delete(type),
    },
    setTimeout: (handler) => {
      timeout = handler;
      return 1;
    },
    clearTimeout: () => {},
    requestAnimationFrame: (handler) => handler(),
  };
  runInNewContext(
    `(${bootstrapAppearance.toString()})(${JSON.stringify(STORAGE)}, [{family:'Test',sample:'ذكر'}])`,
    context,
  );
  return {
    dataset,
    ready: () => events.get('zaadi:ready')?.(),
    timeout: () => timeout(),
    loaded: () => resolveFonts([{}]),
  };
}
const flushPromises = () => new Promise((resolve) => setImmediate(resolve));
test('first paint restores theme and waits for both fonts and reader readiness', async () => {
  const page = appearanceHarness({
    stored: JSON.stringify({
      version: 1,
      theme: 'dark',
      background: 'pattern',
    }),
  });
  assert.equal(page.dataset.theme, 'dark');
  assert.equal(page.dataset.background, 'pattern');
  page.ready();
  assert.equal(page.dataset.boot, 'loading');
  page.loaded();
  await flushPromises();
  assert.equal(page.dataset.boot, 'ready');
  assert.equal(page.dataset.fonts, undefined);
});
test('font failure reveals a stable fallback; late fonts cannot replace it', async () => {
  const page = appearanceHarness({ denied: true });
  assert.equal(page.dataset.theme, 'light');
  assert.equal(page.dataset.background, 'plain');
  page.ready();
  page.timeout();
  assert.equal(page.dataset.boot, 'ready');
  assert.equal(page.dataset.fonts, 'fallback');
  page.loaded();
  await flushPromises();
  assert.equal(page.dataset.fonts, 'fallback');
});
test('missing reader script cannot leave the page hidden indefinitely', async () => {
  const page = appearanceHarness({ stored: '{' });
  page.loaded();
  await flushPromises();
  assert.equal(page.dataset.boot, 'loading');
  page.timeout();
  assert.equal(page.dataset.boot, 'ready');
});

test('minimal mode is opt-in and accepts only a persisted boolean', () => {
  for (const raw of [
    null,
    '{',
    JSON.stringify({ version: 1 }),
    JSON.stringify({ version: 1, minimal: 'true' }),
  ])
    assert.equal(parsePreferences(raw).minimal, false);
  assert.equal(
    parsePreferences(JSON.stringify({ version: 1, minimal: true })).minimal,
    true,
  );
});
test('panel and undo shortcuts use physical Alt keys and respect input guards', () => {
  for (const [code, action] of [
    ['KeyS', 'settings'],
    ['KeyZ', 'undo'],
  ]) {
    assert.equal(keyboardAction({ code, key: 'س', altKey: true }), action);
    assert.equal(keyboardAction({ code, key: 's' }), null);
    assert.equal(
      keyboardAction({ code, altKey: true }, { blocked: true }),
      null,
    );
    for (const flag of [
      'ctrlKey',
      'metaKey',
      'shiftKey',
      'repeat',
      'isComposing',
    ])
      assert.equal(keyboardAction({ code, altKey: true, [flag]: true }), null);
  }
});

test('Space reads from the page or text without overriding other controls or scrolling on hold', () => {
  for (const scope of [{ page: true }, { reading: true }]) {
    assert.equal(keyboardAction({ key: ' ' }, scope), 'count');
    assert.equal(keyboardAction({ key: ' ', repeat: true }, scope), 'suppress');
    assert.equal(
      keyboardAction({ key: ' ' }, { ...scope, blocked: true }),
      null,
    );
    for (const modifier of ['altKey', 'ctrlKey', 'metaKey', 'shiftKey'])
      assert.equal(keyboardAction({ key: ' ', [modifier]: true }, scope), null);
  }
  assert.equal(keyboardAction({ key: ' ' }), null);
  const items = [
    { id: 'one', count: 1 },
    { id: 'three', count: 3 },
  ];
  let state = newReading();
  for (let i = 0; i < 2; i++) {
    if (keyboardAction({ key: ' ' }, { page: true }) === 'count')
      state = readingReducer(state, { type: 'read', items });
  }
  assert.equal(state.index, 1);
  assert.equal(state.counts.one, 1);
  assert.equal(state.counts.three, 1);
});

test('Escape opens collections only outside dialogs and replaces Alt+L', () => {
  assert.equal(keyboardAction({ key: 'Escape' }), 'list');
  assert.equal(keyboardAction({ key: 'Escape' }, { reading: true }), 'list');
  assert.equal(keyboardAction({ key: 'Escape' }, { blocked: true }), null);
  for (const flag of [
    'altKey',
    'ctrlKey',
    'metaKey',
    'shiftKey',
    'repeat',
    'isComposing',
    'defaultPrevented',
  ])
    assert.equal(keyboardAction({ key: 'Escape', [flag]: true }), null);
  assert.equal(keyboardAction({ key: 'l', code: 'KeyL', altKey: true }), null);
});

test('a remembrance keeps a distinct place in every collection it belongs to', () => {
  const groups = new Set(['morning', 'evening', 'sleep']);
  const taken = new Map();
  assert.deepEqual(
    validatePlacement({ morning: 8, sleep: 12 }, groups, taken),
    [
      ['morning', 8],
      ['sleep', 12],
    ],
  );
  assert.doesNotThrow(() => validatePlacement({ evening: 8 }, groups, taken));
  assert.throws(() => validatePlacement({ morning: 8 }, groups, taken));
  assert.throws(() => validatePlacement({ dawn: 1 }, groups, new Map()));
  assert.throws(() => validatePlacement({ morning: 0 }, groups, new Map()));
  assert.throws(() => validatePlacement({}, groups, new Map()));
  assert.throws(() => validatePlacement(undefined, groups, new Map()));
});

test('added narration collections keep their own linked source pages', () => {
  for (const source of ['ibnmajah:925', 'muslim:593a', 'bukhari:6311'])
    assert.doesNotThrow(() =>
      validateSource({ source, url: `https://sunnah.com/${source}` }),
    );
  assert.throws(() =>
    validateSource({
      source: 'hisn:77',
      url: 'https://sunnah.com/hisn:77',
    }),
  );
});

test('the page pattern is opt-in and survives only as an exact stored value', () => {
  for (const raw of [
    null,
    '{',
    JSON.stringify({ version: 1 }),
    JSON.stringify({ version: 1, background: 'Pattern' }),
    JSON.stringify({ version: 1, background: true }),
    JSON.stringify({ version: 0, background: 'pattern' }),
  ])
    assert.equal(parsePreferences(raw).background, 'plain');
  assert.equal(
    parsePreferences(JSON.stringify({ version: 1, background: 'pattern' }))
      .background,
    'pattern',
  );
  assert.equal(defaultPreferences().background, 'plain');
});
