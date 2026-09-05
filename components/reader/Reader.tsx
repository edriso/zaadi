'use client';
import {
  useEffect,
  useRef,
  useState,
  useReducer,
  useMemo,
  useCallback,
  type PointerEvent,
} from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Heart,
  Minus,
  Moon,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Sun,
  Sunrise,
  Sunset,
  BookOpen,
  ExternalLink,
} from 'lucide-react';
import { collections, getItems, type Preferences } from '@/lib/content';
import { useFitText } from '@/lib/useFitText';
import { useAppearance } from '@/lib/useAppearance';
import { useWebMcp } from '@/lib/useWebMcp';
import {
  keyboardAction,
  cities,
  clampZoom,
  MAX_ZOOM,
  MIN_ZOOM,
  parsePreferences,
  referenceNumber,
  suggestion,
  swipeDirection,
} from '@/lib/core.mjs';
import { Panel } from './Panel';
import { newReading, readingReducer, isReadingTap } from '@/lib/reading.mjs';
import { STORAGE } from '@/lib/appearance.mjs';
const methodLabels: Record<string, string> = {
  Egyptian: 'الهيئة المصرية للمساحة',
  MuslimWorldLeague: 'رابطة العالم الإسلامي',
  Dubai: 'دبي',
  Turkey: 'تركيا',
  MoonsightingCommittee: 'لجنة رؤية الهلال',
  Karachi: 'جامعة العلوم الإسلامية، كراتشي',
};
const icons: Record<string, typeof Sun> = {
  morning: Sunrise,
  evening: Sunset,
  prayer: Sun,
  sleep: Moon,
  general: Heart,
};
type Gesture = {
  x: number;
  y: number;
  time: number;
  multitouch?: boolean;
  canceled?: boolean;
  moved?: boolean;
};
export function Reader() {
  const [collection, setCollection] = useState('general');
  const [reading, dispatch] = useReducer(readingReducer, undefined, newReading);
  const { index, counts } = reading;
  const [preferences, setPreferences] = useState<Preferences>({
    zoom: 1,
    minimal: false,
    theme: 'light',
    city: '',
    method: '',
    hanafi: false,
  });
  const [panel, setPanel] = useState<'list' | 'settings' | 'source' | null>(
    null,
  );
  const [storageMessage, setStorageMessage] = useState('');
  const [openingNote, setOpeningNote] = useState('');
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const viewport = useRef<HTMLElement>(null),
    text = useRef<HTMLButtonElement>(null);
  const tapAllowed = useRef(false);
  const lastReadAt = useRef(-Infinity);
  const gesture = useRef<Gesture | null>(null);
  const preferencesRef = useRef(preferences);
  const trigger = useRef<HTMLElement | null>(null);
  const settingsButton = useRef<HTMLButtonElement>(null);
  const selectedItems = useMemo(() => getItems(collection), [collection]),
    item = selectedItems[index],
    group = collections.find((value) => value.id === collection)!;
  const base = useFitText(viewport, text, item.id);
  const count = counts[item.id] ?? 0,
    complete = item.count !== null && count >= item.count;
  const Icon = icons[collection];
  const recommendation = now ? suggestion(now, preferences) : null;
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      let stored: Preferences;
      try {
        stored = parsePreferences(localStorage.getItem(STORAGE));
      } catch {
        stored = parsePreferences(null);
        setStorageMessage(
          'تعذّر الوصول إلى الحفظ المحلي. يمكنك القراءة وتغيير الإعدادات لهذه الزيارة.',
        );
      }
      preferencesRef.current = stored;
      setPreferences(stored);
      const date = new Date();
      setNow(date);
      const preferred = suggestion(date, stored);
      const hash = window.location.hash.slice(1);
      setCollection(
        collections.some((value) => value.id === hash) ? hash : preferred.id,
      );
      setOpeningNote(
        hash && collections.some((value) => value.id === hash)
          ? 'مجموعة اخترتها من الرابط'
          : preferred.label,
      );
      setReady(true);
    });
    const hashChange = () => {
      const target = window.location.hash.slice(1);
      const chosen = collections.some((value) => value.id === target)
        ? target
        : suggestion(new Date(), preferencesRef.current).id;
      setCollection(chosen);
      dispatch({ type: 'reset' });
      setOpeningNote(
        target ? 'اختيار من القائمة أو الرابط' : 'اقتراح بحسب وقت فتح الصفحة',
      );
    };
    const refresh = () => {
      if (document.visibilityState === 'visible') setNow(new Date());
    };
    window.addEventListener('hashchange', hashChange);
    document.addEventListener('visibilitychange', refresh);
    const timer = window.setInterval(refresh, 60000);
    return () => {
      active = false;
      window.removeEventListener('hashchange', hashChange);
      document.removeEventListener('visibilitychange', refresh);
      window.clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    preferencesRef.current = preferences;
    if (!ready) return;
    try {
      localStorage.setItem(
        STORAGE,
        JSON.stringify({ version: 1, ...preferences }),
      );
    } catch {
      queueMicrotask(() =>
        setStorageMessage('تعذّر حفظ الإعدادات. ستبقى متاحة حتى إغلاق الصفحة.'),
      );
    }
  }, [preferences, ready]);
  useAppearance(ready, preferences.theme);
  useEffect(() => {
    viewport.current?.scrollTo({ top: 0, behavior: 'auto' });
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const animation = text.current?.animate?.(
      [{ opacity: 0.4 }, { opacity: 1 }],
      { duration: 160, easing: 'ease-out' },
    );
    return () => animation?.cancel();
  }, [item.id]);
  const closePanel = () => {
    setPanel(null);
    requestAnimationFrame(() => {
      const previous = trigger.current;
      const target =
        previous?.isConnected && previous.getClientRects().length
          ? previous
          : settingsButton.current;
      target?.focus({ preventScroll: true });
    });
  };
  const openPanel = useCallback(
    (target: 'list' | 'settings' | 'source') => {
      if (!panel) {
        const active = document.activeElement;
        trigger.current =
          active instanceof HTMLElement && active !== document.body
            ? active
            : settingsButton.current;
      }
      setNow(new Date());
      setPanel(target);
    },
    [panel],
  );
  const choose = (id: string, automatic = false) => {
    if (!collections.some((value) => value.id === id)) return;
    setCollection(id);
    dispatch({ type: 'reset' });
    setOpeningNote(
      automatic
        ? suggestion(new Date(), preferences).label
        : 'اخترت هذه المجموعة من القائمة',
    );
    const url =
      window.location.pathname +
      window.location.search +
      (automatic ? '' : `#${id}`);
    if (
      window.location.pathname +
        window.location.search +
        window.location.hash !==
      url
    )
      window.history.pushState(null, '', url);
    closePanel();
  };
  const navigate = (delta: number) =>
    dispatch({ type: 'navigate', index: index + delta, items: selectedItems });
  const recordReading = useCallback(() => {
    if (!ready || panel || window.getSelection()?.toString()) return;
    const now = performance.now();
    if (now - lastReadAt.current < 250) return;
    lastReadAt.current = now;
    dispatch({ type: 'read', items: selectedItems });
  }, [ready, panel, selectedItems]);
  const changeZoom = (value: number) =>
    setPreferences((current) => ({ ...current, zoom: clampZoom(value) }));
  useWebMcp(
    { collection, item: item.id, index, zoom: preferences.zoom },
    { select: choose, zoom: changeZoom },
  );
  const startPointer = (event: PointerEvent<HTMLElement>) => {
    tapAllowed.current = false;
    if (!event.isPrimary) {
      if (gesture.current) gesture.current.multitouch = true;
      return;
    }
    if (event.button !== 0) return;
    gesture.current = {
      x: event.clientX,
      y: event.clientY,
      time: event.timeStamp,
    };
  };
  const movePointer = (event: PointerEvent<HTMLElement>) => {
    if (!gesture.current || !event.isPrimary) return;
    const dx = event.clientX - gesture.current.x,
      dy = event.clientY - gesture.current.y;
    if (Math.hypot(dx, dy) >= 10) gesture.current.moved = true;
    if (Math.abs(dy) > 18 && Math.abs(dy) > Math.abs(dx))
      gesture.current.canceled = true;
  };
  const endPointer = (event: PointerEvent<HTMLElement>) => {
    if (!event.isPrimary) return;
    const end = { x: event.clientX, y: event.clientY, time: event.timeStamp };
    const selected = Boolean(window.getSelection()?.toString());
    tapAllowed.current = !selected && isReadingTap(gesture.current, end);
    const direction =
      selected || event.pointerType === 'mouse'
        ? 0
        : swipeDirection(gesture.current, end);
    if (direction) navigate(direction);
    gesture.current = null;
  };
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const action = keyboardAction(event, {
        blocked:
          !ready ||
          Boolean(panel) ||
          Boolean(window.getSelection()?.toString()) ||
          Boolean(
            target.closest(
              'input,select,textarea,[contenteditable]:not([contenteditable="false"]),dialog,[role="slider"]',
            ),
          ),
        reading: target === viewport.current || target === text.current,
        page: target === document.body || target === document.documentElement,
      });
      if (!action) return;
      event.preventDefault();
      if (action === 'next' || action === 'previous') {
        dispatch({
          type: 'navigate',
          index: index + (action === 'next' ? 1 : -1),
          items: selectedItems,
        });
        viewport.current?.focus({ preventScroll: true });
      }
      if (action === 'first')
        dispatch({ type: 'navigate', index: 0, items: selectedItems });
      if (action === 'last')
        dispatch({
          type: 'navigate',
          index: selectedItems.length - 1,
          items: selectedItems,
        });
      if (action === 'count') recordReading();
      if (action === 'settings' || action === 'list') openPanel(action);
      if (action === 'undo') dispatch({ type: 'undo' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ready, panel, selectedItems, index, recordReading, openPanel]);
  return (
    <main className={`reader${preferences.minimal ? ' is-minimal' : ''}`}>
      <button
        className="skip-reading"
        onClick={() => viewport.current?.focus()}
      >
        انتقل إلى نص الذكر
      </button>
      <header className="reader-header">
        <button
          className="icon-button"
          aria-label="العودة إلى قائمة الأذكار"
          aria-keyshortcuts="Escape"
          onClick={() => openPanel('list')}
        >
          <ArrowRight size={21} />
        </button>
        <span className="wordmark">
          زادي<span>ذكر يرافق يومك</span>
        </span>
        <button
          className="icon-button"
          aria-label="إعدادات القراءة"
          title="إعدادات القراءة · Alt + S"
          aria-keyshortcuts="Alt+s"
          ref={settingsButton}
          onClick={() => openPanel('settings')}
        >
          <SlidersHorizontal size={20} />
        </button>
      </header>
      <div className="collection-heading">
        <Icon size={20} aria-hidden="true" />
        <h1>{group.title}</h1>
        <span aria-label={`الذكر ${index + 1} من ${selectedItems.length}`}>
          {referenceNumber(index + 1)} / {referenceNumber(selectedItems.length)}
        </span>
      </div>
      <button className="timing-note" onClick={() => openPanel('settings')}>
        {openingNote || 'اقتراح بحسب الوقت · يمكنك اختيار مجموعة أخرى'}
      </button>
      {/* oxlint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex -- A scrollable reading region must be focusable for keyboard scrolling; arrow keys provide the same navigation as visible buttons. */}
      <section
        className="reading-area"
        ref={viewport}
        tabIndex={0}
        aria-label="نص الذكر؛ السهم الأيمن للتالي، والأيسر للسابق، والمسافة أو Enter لتسجيل قراءة"
        aria-keyshortcuts="ArrowLeft ArrowRight Home End Enter Space"
        onPointerDown={startPointer}
        onPointerMove={movePointer}
        onPointerUp={endPointer}
        onPointerCancel={() => {
          tapAllowed.current = false;
          gesture.current = null;
        }}
      >
        <button
          type="button"
          aria-describedby="tap-hint"
          onKeyDown={(event) => {
            if (event.repeat && (event.key === 'Enter' || event.key === ' '))
              event.preventDefault();
          }}
          onClick={(event) => {
            if (event.detail === 0 || tapAllowed.current) recordReading();
            tapAllowed.current = false;
          }}
          className={`dhikr-text ${item.quran.length ? 'quran' : ''}`}
          ref={text}
          style={{ fontSize: Math.max(16, base * preferences.zoom) }}
        >
          {item.quran.length
            ? item.quran.map((verse) => (
                <span key={verse.reference}>
                  {verse.text}
                  <span className="verse-number">
                    {' '}
                    ﴿{referenceNumber(verse.ayah)}﴾{' '}
                  </span>
                </span>
              ))
            : item.text}
        </button>
      </section>
      {/* oxlint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
      <div className="reading-note">
        <p>{item.title}</p>
        <button className="source-button" onClick={() => openPanel('source')}>
          المصدر
        </button>
      </div>
      <p id="tap-hint" className="hint-line">
        {item.count === null
          ? 'اقرأ على مهل؛ الضغط على النص ينقلك للتالي'
          : 'اضغط على الذكر لتسجيل قراءة؛ ننتقل للتالي عند اكتمال العدد'}
      </p>
      <div className="counter-area">
        <div className="counter-row">
          <button
            className="undo-button"
            aria-label="التراجع عن آخر قراءة والعودة إليها"
            disabled={reading.history.length === 0}
            onClick={() => dispatch({ type: 'undo' })}
          >
            <RotateCcw size={17} />
          </button>
          <button
            className={`count-button ${complete ? 'is-counted' : ''}`}
            disabled={
              (complete || item.count === null) &&
              index === selectedItems.length - 1
            }
            onClick={recordReading}
            onKeyDown={(event) => {
              if (event.repeat && (event.key === 'Enter' || event.key === ' '))
                event.preventDefault();
            }}
          >
            {complete && index === selectedItems.length - 1 ? (
              <>
                <Check size={19} />
                {item.count === 1 ? 'تمت القراءة' : 'اكتمل العدد'}
              </>
            ) : item.count === null || complete ? (
              'التالي'
            ) : (
              <>
                قرأت{' '}
                {item.count > 1 && (
                  <span>
                    {referenceNumber(count)} / {referenceNumber(item.count)}
                  </span>
                )}
              </>
            )}
          </button>
          <span className="counter-balance" aria-hidden="true" />
        </div>
        <p className="counter-label">
          {item.count === null
            ? 'ذكر مطلق؛ لا عدد محدد في الرواية'
            : item.countKind === 'single-recitation'
              ? 'قراءة واحدة؛ دون تكرار معدود في الرواية'
              : item.id === 'daily-tasbih'
                ? 'مئة مرة في اليوم'
                : `${referenceNumber(item.count)} ${item.count === 3 ? 'مرات' : 'مرة'}`}
        </p>
      </div>
      <output
        className="minimal-count"
        aria-live="off"
        aria-label={
          item.count === null
            ? 'ذكر بلا عدد محدد'
            : `قراءات مسجلة ${count} من ${item.count}`
        }
      >
        {item.count === null
          ? index === selectedItems.length - 1
            ? 'آخر ذكر'
            : ''
          : complete
            ? 'تمت القراءة'
            : `${referenceNumber(count)} / ${referenceNumber(item.count)}`}
      </output>
      <footer className="reader-footer">
        <button
          disabled={index === selectedItems.length - 1}
          onClick={() => navigate(1)}
          aria-keyshortcuts="ArrowRight"
        >
          <ArrowRight size={19} aria-hidden="true" />
          التالي
        </button>
        <span>
          {index === selectedItems.length - 1
            ? 'آخر ذكر في المجموعة'
            : 'اسحب لليمين للتالي'}
        </span>
        <button
          disabled={index === 0}
          onClick={() => navigate(-1)}
          aria-keyshortcuts="ArrowLeft"
        >
          السابق
          <ArrowLeft size={19} aria-hidden="true" />
        </button>
      </footer>
      <div className="reader-progress" aria-hidden="true">
        <span
          style={{ width: `${((index + 1) / selectedItems.length) * 100}%` }}
        />
      </div>
      <output className="read-status" aria-live="polite">
        {ready
          ? `${group.title}، ${item.title}، ${index + 1} من ${selectedItems.length}${item.count !== null ? `، قراءات مسجلة ${count} من ${item.count}` : ''}`
          : ''}
      </output>
      <noscript>
        <div className="noscript">
          تحتاج أدوات القراءة إلى JavaScript. النص الظاهر متاح للقراءة، ويمكنك
          الرجوع إلى مصدره عند تفعيل الأدوات.
        </div>
      </noscript>
      <Panel
        open={panel !== null}
        title={
          panel === 'list'
            ? 'اختر أذكارك'
            : panel === 'settings'
              ? 'إعدادات القراءة'
              : 'النص ومصدره'
        }
        onClose={closePanel}
      >
        {panel === 'list' && (
          <>
            <p className="panel-intro">
              لكل وقت زاده. اختر ما تريد قراءته على مهل.
            </p>
            {recommendation && (
              <button
                className="time-suggestion"
                onClick={() => choose(recommendation.id, true)}
              >
                <Sunrise size={21} />
                <span>
                  <strong>
                    المقترح الآن:{' '}
                    {
                      collections.find(
                        (value) => value.id === recommendation.id,
                      )?.title
                    }
                  </strong>
                  <small>{recommendation.label}</small>
                </span>
                <ArrowLeft size={18} />
              </button>
            )}
            <div className="collection-list">
              {collections.map((value) => {
                const GroupIcon = icons[value.id];
                return (
                  <button key={value.id} onClick={() => choose(value.id)}>
                    <span className="collection-icon">
                      <GroupIcon size={23} />
                    </span>
                    <span>
                      <strong>{value.title}</strong>
                      <small>{value.description}</small>
                    </span>
                    <span className="collection-size">
                      {referenceNumber(getItems(value.id).length)}
                    </span>
                    <ArrowLeft size={17} />
                  </button>
                );
              })}
            </div>
            <p className="small-note">
              اختيار مجموعة يبدأ قراءة جديدة. الأعداد لا تُحفظ بعد إغلاق الصفحة،
              وليست سجلًا للعبادة.
            </p>
          </>
        )}
        {panel === 'settings' && (
          <>
            <section className="setting-section">
              <h3>المظهر</h3>
              <label className="checkbox-label" htmlFor="minimal">
                <input
                  id="minimal"
                  type="checkbox"
                  checked={preferences.minimal}
                  aria-describedby="minimal-description"
                  onChange={(event) =>
                    setPreferences((current) => ({
                      ...current,
                      minimal: event.target.checked,
                    }))
                  }
                />
                واجهة مختصرة
              </label>
              <p id="minimal-description" className="small-note">
                يظهر نص الذكر وعدّاده وزر الإعدادات فقط. اضغط على النص لتسجيل
                قراءة، واسحب لليمين للتالي أو لليسار للسابق. يمكنك إظهار الواجهة
                كاملة من هنا متى شئت.
              </p>
              <label htmlFor="theme">لون الواجهة</label>
              <select
                id="theme"
                value={preferences.theme}
                onChange={(event) =>
                  setPreferences((current) => ({
                    ...current,
                    theme: event.target.value as Preferences['theme'],
                  }))
                }
              >
                <option value="light">فاتح</option>
                <option value="dark">داكن</option>
                <option value="system">بحسب إعداد الجهاز</option>
              </select>
            </section>
            <section className="setting-section">
              <h3>أدوات القراءة</h3>
              <div className="reading-tools">
                <button
                  className="plain-button"
                  onClick={() => openPanel('list')}
                >
                  قائمة الأذكار
                </button>
                <button
                  className="plain-button"
                  onClick={() => openPanel('source')}
                >
                  مصدر الذكر الحالي
                </button>
                <button
                  className="plain-button"
                  disabled={reading.history.length === 0}
                  onClick={() => {
                    dispatch({ type: 'undo' });
                    closePanel();
                  }}
                >
                  التراجع عن آخر قراءة
                </button>
              </div>
            </section>
            <section className="setting-section">
              <h3>حجم النص</h3>
              <p className="small-note">
                يناسب النص المساحة أولًا. يمكنك تكبيره حتى ١٦٠٪؛ وقد تحتاج إلى
                التمرير.
              </p>
              <div className="zoom-controls">
                <button
                  className="icon-button"
                  aria-label="تصغير النص"
                  disabled={preferences.zoom <= MIN_ZOOM}
                  onClick={() => changeZoom(preferences.zoom - 0.1)}
                >
                  <Minus size={19} />
                </button>
                <output aria-live="polite">
                  {referenceNumber(Math.round(preferences.zoom * 100))}٪
                </output>
                <button
                  className="icon-button"
                  aria-label="تكبير النص"
                  disabled={preferences.zoom >= MAX_ZOOM}
                  onClick={() => changeZoom(preferences.zoom + 0.1)}
                >
                  <Plus size={19} />
                </button>
              </div>
              <input
                className="zoom-range"
                type="range"
                min="0.8"
                max="1.6"
                step="0.1"
                aria-label="حجم النص"
                value={preferences.zoom}
                onChange={(event) => changeZoom(Number(event.target.value))}
              />
              <button className="plain-button" onClick={() => changeZoom(1)}>
                الحجم المناسب تلقائيًا
              </button>
            </section>
            <section className="setting-section">
              <h3>اختيار الأذكار بحسب الوقت</h3>
              <p className="small-note">{openingNote}.</p>
              <label htmlFor="city">
                المدينة <span>اختياري</span>
              </label>
              <select
                id="city"
                value={preferences.city}
                onChange={(event) =>
                  setPreferences((current) => ({
                    ...current,
                    city: event.target.value,
                    method: '',
                  }))
                }
              >
                <option value="">ساعة الجهاز — اقتراح تقريبي</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.label}
                  </option>
                ))}
              </select>
              {preferences.city && (
                <>
                  <label htmlFor="method">طريقة حساب المواقيت</label>
                  <select
                    id="method"
                    value={preferences.method}
                    onChange={(event) =>
                      setPreferences((current) => ({
                        ...current,
                        method: event.target.value,
                      }))
                    }
                  >
                    <option value="">الإعداد المقترح للمدينة</option>
                    {Object.entries(methodLabels).map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={preferences.hanafi}
                      onChange={(event) =>
                        setPreferences((current) => ({
                          ...current,
                          hanafi: event.target.checked,
                        }))
                      }
                    />
                    حساب العصر على المذهب الحنفي
                  </label>
                </>
              )}
              <p className="small-note">
                حساب محلي يساعد على اختيار المجموعة، وليس تقويمًا معتمدًا للصلاة.
                بعد الصلاة وقبل النوم تختارهما بنفسك. إن اختلف التوقيت عندك فاختر
                المجموعة المناسبة يدويًا.
              </p>
              {recommendation && (
                <button
                  className="plain-button"
                  onClick={() => choose(recommendation.id, true)}
                >
                  افتح المقترح الآن <ArrowLeft size={16} />
                </button>
              )}
            </section>
            <section className="setting-section keyboard-guide">
              <h3>لوحة المفاتيح</h3>
              <p className="small-note">
                استخدم Tab للتنقّل بين الأزرار، وShift + Tab للعودة. افتح الزر
                المحدد بمفتاح Enter أو المسافة، وأغلق النافذة بمفتاح Escape.
              </p>
              <dl className="keyboard-help">
                <div>
                  <dt>
                    <kbd>Alt + S</kbd>
                  </dt>
                  <dd>فتح الإعدادات</dd>
                </div>
                <div>
                  <dt>
                    <kbd>Esc</kbd>
                  </dt>
                  <dd>فتح قائمة الأذكار؛ وإغلاق النافذة إن كانت مفتوحة</dd>
                </div>
                <div>
                  <dt>
                    <kbd>Alt + Z</kbd>
                  </dt>
                  <dd>التراجع عن آخر قراءة</dd>
                </div>
                <div>
                  <dt>
                    <kbd>→</kbd> / <kbd>←</kbd>
                  </dt>
                  <dd>الذكر التالي / السابق</dd>
                </div>
                <div>
                  <dt>
                    <kbd>Home</kbd> / <kbd>End</kbd>
                  </dt>
                  <dd>أول ذكر / آخر ذكر، عند التركيز على النص</dd>
                </div>
                <div>
                  <dt>
                    <kbd>Space</kbd>
                  </dt>
                  <dd>
                    تسجيل قراءة من الصفحة أو النص، ثم الانتقال عند اكتمال العدد
                  </dd>
                </div>
                <div>
                  <dt>
                    <kbd>Enter</kbd>
                  </dt>
                  <dd>تسجيل قراءة، عند التركيز على النص</dd>
                </div>
                <div>
                  <dt>
                    <kbd>↑</kbd> / <kbd>↓</kbd>
                  </dt>
                  <dd>تمرير النص الطويل</dd>
                </div>
              </dl>
              <p className="small-note">
                في أجهزة Mac استخدم Option بدل Alt. ابدأ بزر «انتقل إلى نص
                الذكر» الذي يظهر عند الضغط على Tab. لا تغيّر الاختصارات الأذكار
                أثناء فتح الإعدادات أو تحديد النص.
              </p>
            </section>
            <section className="setting-section">
              <h3>الخصوصية والمصادر</h3>
              <p className="small-note">
                تُحفظ هذه الإعدادات في هذا الجهاز فقط. لا نطلب موقعك الدقيق، ولا
                نضيف حسابات أو تتبّعًا. لكل ذكر مصدره وعدده، وهذه مختارات لا تستوعب
                جميع الأذكار الواردة.
              </p>
              {storageMessage && (
                <output className="storage-message">{storageMessage}</output>
              )}
              <a
                href="https://github.com/edriso/zaadi/issues"
                className="external-link"
              >
                أبلغ عن خطأ <ExternalLink size={14} />
              </a>
            </section>
          </>
        )}
        {panel === 'source' && (
          <>
            <span className="source-badge">
              <BookOpen size={16} />
              {item.title}
            </span>
            <h3 className="source-grade">{item.grade}</h3>
            <p className="small-note">الراوي: {item.narrator}</p>
            <a
              className="source-link"
              href={item.url}
              target="_blank"
              rel="noreferrer"
            >
              اقرأ المصدر والتخريج{' '}
              <span>
                {
                  (
                    {
                      bukhari: 'صحيح البخاري',
                      muslim: 'صحيح مسلم',
                      abudawud: 'سنن أبي داود',
                      targhib: 'صحيح الترغيب · الدرر السنية',
                      nataij: 'نتائج الأفكار · الدرر السنية',
                    } as Record<string, string>
                  )[item.source.split(':')[0]]
                }{' '}
                · <bdi>{referenceNumber(item.source.split(':')[1])}</bdi>
              </span>
              <ExternalLink size={16} />
            </a>
            <h3 className="source-subtitle">الوقت والعدد</h3>
            <p className="source-context">{item.context}</p>
            {item.countKind === 'single-recitation' && (
              <p className="small-note">
                زر القراءة الواحدة لتنظيم القراءة، وليس ادّعاء عدد مكرر لم يرد في
                الرواية.
              </p>
            )}
            {item.quran.length > 0 && (
              <>
                <h3 className="source-subtitle">النص القرآني</h3>
                <p className="small-note">
                  من النص العثماني لمشروع تنزيل، دون تعديل.
                </p>
                <a
                  className="external-link"
                  href={`https://tanzil.net/#${item.quran[0].reference}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  افتح الآيات في تنزيل <ExternalLink size={14} />
                </a>
              </>
            )}
            <p className="source-footnote">
              العناوين والتعليمات من إعداد الموقع. نتحرّى صحة النقل، ولا ندّعي
              مراجعة شرعية متخصصة. إذا وجدت خطأ، فأعنّا على تصحيحه.
            </p>
            <a
              href="https://github.com/edriso/zaadi/issues"
              className="external-link"
            >
              أبلغ عن خطأ <ExternalLink size={14} />
            </a>
          </>
        )}
      </Panel>
    </main>
  );
}
