import { CalculationMethod, Coordinates, Madhab, PrayerTimes } from 'adhan';
export const MIN_ZOOM = 0.8;
export const MAX_ZOOM = 1.6;
export const cities = [
  {
    id: 'cairo',
    label: 'القاهرة',
    lat: 30.0444,
    lng: 31.2357,
    zone: 'Africa/Cairo',
    method: 'Egyptian',
  },
  {
    id: 'makkah',
    label: 'مكة المكرمة',
    lat: 21.4225,
    lng: 39.8262,
    zone: 'Asia/Riyadh',
    method: 'MuslimWorldLeague',
  },
  {
    id: 'madinah',
    label: 'المدينة المنورة',
    lat: 24.4672,
    lng: 39.6111,
    zone: 'Asia/Riyadh',
    method: 'MuslimWorldLeague',
  },
  {
    id: 'riyadh',
    label: 'الرياض',
    lat: 24.7136,
    lng: 46.6753,
    zone: 'Asia/Riyadh',
    method: 'MuslimWorldLeague',
  },
  {
    id: 'dubai',
    label: 'دبي',
    lat: 25.2048,
    lng: 55.2708,
    zone: 'Asia/Dubai',
    method: 'Dubai',
  },
  {
    id: 'istanbul',
    label: 'إسطنبول',
    lat: 41.0082,
    lng: 28.9784,
    zone: 'Europe/Istanbul',
    method: 'Turkey',
  },
  {
    id: 'london',
    label: 'لندن',
    lat: 51.5074,
    lng: -0.1278,
    zone: 'Europe/London',
    method: 'MoonsightingCommittee',
  },
];
export const methods = [
  'Egyptian',
  'MuslimWorldLeague',
  'Dubai',
  'Turkey',
  'MoonsightingCommittee',
  'Karachi',
];
export function clampZoom(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 10) / 10))
    : 1;
}
export function parsePreferences(raw) {
  try {
    const value = JSON.parse(raw ?? 'null');
    if (!value || value.version !== 1)
      return {
        zoom: 1,
        city: '',
        method: '',
        hanafi: false,
        theme: 'light',
        minimal: false,
      };
    return {
      zoom: clampZoom(value.zoom),
      minimal: value.minimal === true,
      theme: ['light', 'dark', 'system'].includes(value.theme)
        ? value.theme
        : 'light',
      city: cities.some((city) => city.id === value.city) ? value.city : '',
      method: methods.includes(value.method) ? value.method : '',
      hanafi: value.hanafi === true,
    };
  } catch {
    return {
      zoom: 1,
      city: '',
      method: '',
      hanafi: false,
      theme: 'light',
      minimal: false,
    };
  }
}
export function approximateCollection(hour) {
  return hour >= 4 && hour < 12
    ? 'morning'
    : hour >= 15 && hour < 21
      ? 'evening'
      : 'general';
}
export function chooseByTimes(now, times) {
  const time = now.getTime();
  if (
    ![times.fajr, times.dhuhr, times.asr, times.isha].every(
      (value) => value instanceof Date && Number.isFinite(value.getTime()),
    )
  )
    return null;
  if (time >= times.fajr.getTime() && time < times.dhuhr.getTime())
    return 'morning';
  if (time >= times.asr.getTime() && time < times.isha.getTime())
    return 'evening';
  return 'general';
}
export function suggestion(now, preferences) {
  const city = cities.find((value) => value.id === preferences.city);
  if (!city)
    return {
      id: approximateCollection(now.getHours()),
      approximate: true,
      label: 'اقتراح تقريبي بحسب ساعة جهازك',
    };
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: city.zone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(now);
  const part = (type) =>
    Number(parts.find((value) => value.type === type)?.value);
  try {
    const params = CalculationMethod[preferences.method || city.method]();
    params.madhab = preferences.hanafi ? Madhab.Hanafi : Madhab.Shafi;
    const times = new PrayerTimes(
      new Coordinates(city.lat, city.lng),
      new Date(part('year'), part('month') - 1, part('day')),
      params,
    );
    const selected = chooseByTimes(now, times);
    if (selected)
      return {
        id: selected,
        approximate: false,
        label: `بحسب المواقيت المحسوبة في ${city.label}`,
      };
  } catch {
    /* Local clock fallback remains explicitly labelled. */
  }
  return {
    id: approximateCollection(part('hour')),
    approximate: true,
    label: `اقتراح تقريبي لمدينة ${city.label} لتعذّر حساب المواقيت`,
  };
}
export function swipeDirection(start, end) {
  if (!start || !end || start.canceled || start.multitouch) return 0;
  const dx = end.x - start.x,
    dy = end.y - start.y;
  if (
    end.time - start.time > 750 ||
    Math.abs(dx) < 60 ||
    Math.abs(dx) < Math.abs(dy) * 1.8
  )
    return 0;
  return dx > 0 ? 1 : -1; // RTL: a rightward swipe turns to the next text.
}
export function boundedIndex(index, delta, length) {
  return Math.max(0, Math.min(length - 1, index + delta));
}
export function referenceNumber(value) {
  return String(value).replace(
    /[0-9]/g,
    (digit) => '٠١٢٣٤٥٦٧٨٩'[Number(digit)],
  );
}

// Panel shortcuts require Alt; native activation and scrolling remain available.
export function keyboardAction(
  event,
  { blocked = false, reading = false } = {},
) {
  if (
    blocked ||
    event.defaultPrevented ||
    event.isComposing ||
    event.repeat ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  )
    return null;
  if (event.altKey)
    return { KeyS: 'settings', KeyL: 'list', KeyZ: 'undo' }[event.code] ?? null;
  if (event.key === 'ArrowRight') return 'next';
  if (event.key === 'ArrowLeft') return 'previous';
  if (!reading) return null;
  return { Home: 'first', End: 'last', Enter: 'count' }[event.key] ?? null;
}
