import data from '@/content/azkar.generated.json';
export const collections = data.collections;
export const items = data.items;
export type Dhikr = (typeof data.items)[number];
export type Preferences = {
  zoom: number;
  theme: 'light' | 'dark' | 'system';
  city: string;
  method: string;
  hanafi: boolean;
};
export const getItems = (collection: string) =>
  items.filter((item) => item.groups.includes(collection));
