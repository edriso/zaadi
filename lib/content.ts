import data from '@/content/azkar.generated.json';
export const collections = data.collections;
export const items = data.items;
export type Dhikr = (typeof data.items)[number];
export type Preferences = {
  zoom: number;
  minimal: boolean;
  theme: 'light' | 'dark' | 'system';
  background: 'plain' | 'pattern';
  city: string;
  method: string;
  hanafi: boolean;
};
/** A remembrance keeps its own place in every collection that contains it. */
const placeIn = (item: Dhikr, collection: string) =>
  item.positions[item.groups.indexOf(collection)];
const cache = new Map<string, Dhikr[]>();
export function getItems(collection: string) {
  const known = cache.get(collection);
  if (known) return known;
  const selected = items
    .filter((item) => item.groups.includes(collection))
    .sort(
      (one, other) => placeIn(one, collection) - placeIn(other, collection),
    );
  cache.set(collection, selected);
  return selected;
}
