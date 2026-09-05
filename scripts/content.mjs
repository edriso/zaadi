import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
export function resolveRefs(references, corpus) {
  return references.flatMap((reference) => {
    const match = /^(\d+):(\d+)(?:-(\d+))?$/.exec(reference);
    assert.ok(match, `Invalid Quran reference: ${reference}`);
    const [, surah, start, end] = match;
    assert.ok(Number(end || start) >= Number(start), 'Reversed Quran range');
    return Array.from(
      { length: Number(end || start) - Number(start) + 1 },
      (_, i) => {
        const ayah = Number(start) + i,
          text = corpus[`${surah}:${ayah}`];
        assert.ok(text, `Missing Quran verse ${surah}:${ayah}`);
        return { text, ayah, reference: `${surah}:${ayah}` };
      },
    );
  });
}
export function validateCount(count, kind) {
  assert.ok(
    ['explicit', 'single-recitation', 'unrestricted'].includes(kind),
    'Unknown count type',
  );
  if (kind === 'unrestricted')
    assert.equal(count, null, 'Unrestricted remembrance has no target');
  else {
    assert.ok(
      Number.isInteger(count) && count > 0 && count <= 100,
      'Invalid count',
    );
    if (kind === 'single-recitation') assert.equal(count, 1);
  }
}
export function validateSource(source) {
  const verifiedLinks = {
    'targhib:661': ['https://dorar.net/h/g1qjT5BF'],
    'nataij:2/401': ['https://dorar.net/h/h40g96Mj?osoul=1'],
    'muslim:2723b': [
      'https://sunnah.com/muslim:2723b',
      'https://binwahaf.com/ar/audio-book-lesson/1117/',
    ],
    // Sunnah.com hosts these two narration numbers on one page.
    'muslim:2709a': ['https://sunnah.com/muslim:2708b'],
  };
  if (Object.hasOwn(verifiedLinks, source.source)) {
    assert.ok(
      verifiedLinks[source.source].includes(source.url),
      'Unverified source destination',
    );
  } else {
    assert.match(
      source.source,
      /^(bukhari|muslim|abudawud|tirmidhi|nasai|ibnmajah):\d+[a-z]?$/,
    );
    assert.equal(source.url, `https://sunnah.com/${source.source}`);
  }
}
/**
 * Each remembrance names the collections it belongs to and its position in
 * every one of them, because the same text sits at a different point in the
 * morning sequence than in the bedtime sequence.
 */
export function validatePlacement(groups, groupIds, seen) {
  const entries = Object.entries(groups ?? {});
  assert.ok(entries.length, 'Remembrance belongs to no collection');
  for (const [group, position] of entries) {
    assert.ok(groupIds.has(group), `Invalid collection ${group}`);
    assert.ok(Number.isInteger(position) && position > 0, 'Invalid position');
    const taken = seen.get(group) ?? new Set();
    assert.ok(!taken.has(position), `Duplicate position ${group}:${position}`);
    taken.add(position);
    seen.set(group, taken);
  }
  return entries;
}
export function buildContent() {
  const manifest = read('data/integrity.json');
  assert.deepEqual(Object.keys(manifest).sort(), [
    'data/quran-uthmani.txt',
    'data/sources.json',
    'data/surah-names.json',
  ]);
  for (const [path, expected] of Object.entries(manifest))
    assert.equal(
      createHash('sha256').update(readFileSync(path)).digest('hex'),
      expected,
      `Changed source ${path}; verify before updating its digest`,
    );
  const corpus = {};
  for (const line of readFileSync('data/quran-uthmani.txt', 'utf8').split(
    '\n',
  )) {
    const m = /^(\d+)\|(\d+)\|(.+)$/.exec(line);
    if (m) corpus[`${m[1]}:${m[2]}`] = m[3];
  }
  assert.equal(Object.keys(corpus).length, 6236);
  const names = read('data/surah-names.json'),
    collections = read('content/collections.json');
  const groupIds = new Set(collections.map((group) => group.id));
  assert.equal(groupIds.size, collections.length);
  const items = [];
  const ids = new Set();
  const positions = new Map();
  for (const source of read('data/sources.json').items) {
    assert.ok(!ids.has(source.id), 'Duplicate remembrance ID');
    ids.add(source.id);
    for (const key of [
      'title',
      'source',
      'narrator',
      'grade',
      'context',
      'url',
      'inspectedAt',
    ])
      assert.ok(
        typeof source[key] === 'string' && source[key].trim(),
        `Missing ${key}`,
      );
    validateSource(source);
    const placement = validatePlacement(source.groups, groupIds, positions);
    const basic = {
      id: source.id,
      title: source.title,
      groups: placement.map(([group]) => group),
      positions: placement.map(([, position]) => position),
      source: source.source,
      url: source.url,
      narrator: source.narrator,
      grade: source.grade,
      context: source.context,
      countKind: source.countKind,
      countLabel: source.countLabel ?? '',
    };
    if (source.id === 'post-prayer-istighfar')
      basic.context += ' وصيغة الاستغفار هنا بيّنها الأوزاعي في الرواية.';
    if (source.segments)
      source.segments.forEach((segment, index) => {
        validateCount(segment.count, source.countKind);
        assert.ok(segment.title && segment.text, 'Incomplete segment');
        items.push({
          ...basic,
          id: `${source.id}-${index}`,
          title: segment.title,
          text: segment.text,
          count: segment.count,
          quran: [],
        });
      });
    else if (source.quranRefs) {
      validateCount(source.count, source.countKind);
      source.quranRefs.forEach((ref, index) =>
        items.push({
          ...basic,
          id: source.quranRefs.length > 1 ? `${source.id}-${index}` : source.id,
          title:
            source.quranRefs.length > 1
              ? `سورة ${names[ref.split(':')[0]].name}`
              : source.title,
          text: '',
          quran: resolveRefs([ref], corpus),
          count: source.count,
        }),
      );
    } else {
      validateCount(source.count, source.countKind);
      assert.ok(source.text);
      items.push({
        ...basic,
        text: source.text,
        quran: [],
        count: source.count,
      });
    }
  }
  const sizes = collections.map((group) => {
    const size = items.filter((item) => item.groups.includes(group.id)).length;
    assert.ok(size, `Empty collection ${group.id}`);
    return `${group.id} ${size}`;
  });
  writeFileSync(
    'content/azkar.generated.json',
    JSON.stringify({ collections, items }, null, 2) + '\n',
  );
  console.log(
    `Verified ${items.length} reading cards across ${collections.length} collections: ${sizes.join(', ')}.`,
  );
}
if (process.argv[1]?.endsWith('/content.mjs')) buildContent();
