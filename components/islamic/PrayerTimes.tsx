'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { toBn } from '@/lib/utils';
import { MapPin, ChevronDown, ChevronUp, Moon, Sun, Cloud, Sunset, Star } from 'lucide-react';

const PRAYER_ICON_MAP: Record<string, React.ElementType> = {
  night: Moon, sun: Sun, 'cloud-sun': Cloud, sunset: Sunset,
};
function PrayerIcon({ icon, className }: { icon: string; className?: string }) {
  const I = PRAYER_ICON_MAP[icon] ?? Star;
  return <I size={18} className={className} />;
}
interface PrayerData {
  key: string; name: string; arabic: string; icon: string; start: string; end: string;
}
interface ForbiddenTime {
  name: string; subtitle: string; icon: string; start: string; end: string;
}

// ৬৪ জেলা — বিভাগ → জেলা → [lat, lng]
const DISTRICTS: Record<string, Record<string, [number, number]>> = {
  'ঢাকা': {
    'ঢাকা': [23.8103, 90.4125], 'নারায়ণগঞ্জ': [23.6238, 90.4997],
    'গাজীপুর': [24.0022, 90.4264], 'মানিকগঞ্জ': [23.8630, 89.8690],
    'মুন্সিগঞ্জ': [23.5422, 90.5302], 'রাজবাড়ী': [23.7574, 89.6444],
    'মাদারীপুর': [23.1643, 90.2019], 'শরীয়তপুর': [23.2230, 90.4352],
    'কিশোরগঞ্জ': [24.4449, 90.7766], 'নরসিংদী': [23.9321, 90.7157],
    'ফরিদপুর': [23.6070, 89.8429], 'গোপালগঞ্জ': [23.0052, 89.8267],
    'টাঙ্গাইল': [24.2513, 89.9167],
  },
  'চট্টগ্রাম': {
    'চট্টগ্রাম': [22.3569, 91.7832], 'কক্সবাজার': [21.4272, 92.0058],
    'কুমিল্লা': [23.4607, 91.1809], 'ফেনী': [23.0231, 91.3966],
    'নোয়াখালী': [22.8724, 91.0996], 'লক্ষ্মীপুর': [22.9423, 90.8412],
    'চাঁদপুর': [23.2513, 90.8517], 'ব্রাহ্মণবাড়িয়া': [23.9608, 91.1115],
    'রাঙ্গামাটি': [22.6524, 92.1719], 'খাগড়াছড়ি': [23.1193, 91.9847],
    'বান্দরবান': [22.1953, 92.2184],
  },
  'রাজশাহী': {
    'রাজশাহী': [24.3745, 88.6042], 'বগুড়া': [24.8510, 89.3697],
    'নওগাঁ': [24.8008, 88.9415], 'নাটোর': [24.4220, 88.9990],
    'সিরাজগঞ্জ': [24.4535, 89.7011], 'পাবনা': [24.0064, 89.2372],
    'চাঁপাইনবাবগঞ্জ': [24.5960, 88.2792], 'জয়পুরহাট': [25.1009, 89.0220],
  },
  'খুলনা': {
    'খুলনা': [22.8456, 89.5403], 'যশোর': [23.1667, 89.2167],
    'সাতক্ষীরা': [22.7185, 89.0705], 'বাগেরহাট': [22.6602, 89.7854],
    'নড়াইল': [23.1724, 89.5123], 'মাগুরা': [23.4874, 89.4195],
    'ঝিনাইদহ': [23.5447, 89.1520], 'কুষ্টিয়া': [23.9014, 89.1202],
    'মেহেরপুর': [23.7621, 88.6318], 'চুয়াডাঙ্গা': [23.6401, 88.8417],
  },
  'বরিশাল': {
    'বরিশাল': [22.7010, 90.3535], 'পটুয়াখালী': [22.3596, 90.3298],
    'ভোলা': [22.6859, 90.6482], 'ঝালকাঠি': [22.6404, 90.1979],
    'পিরোজপুর': [22.5841, 89.9739], 'বরগুনা': [22.1564, 90.1242],
  },
  'সিলেট': {
    'সিলেট': [24.8949, 91.8687], 'মৌলভীবাজার': [24.4829, 91.7774],
    'সুনামগঞ্জ': [25.0658, 91.3950], 'হবিগঞ্জ': [24.3745, 91.4156],
  },
  'ময়মনসিংহ': {
    'ময়মনসিংহ': [24.7471, 90.4203], 'নেত্রকোনা': [24.8703, 90.7279],
    'জামালপুর': [24.9375, 89.9378], 'শেরপুর': [25.0194, 90.0147],
  },
  'রংপুর': {
    'রংপুর': [25.7439, 89.2752], 'দিনাজপুর': [25.6279, 88.6338],
    'গাইবান্ধা': [25.3288, 89.5287], 'কুড়িগ্রাম': [25.8078, 89.6361],
    'নীলফামারী': [25.9312, 88.8561], 'লালমনিরহাট': [25.9923, 89.2843],
    'ঠাকুরগাঁও': [26.0313, 88.4616], 'পঞ্চগড়': [26.3408, 88.5553],
  },
};

const DEFAULT_DIVISION = 'রাজশাহী';
const DEFAULT_DISTRICT = 'সিরাজগঞ্জ';
const LS_KEY = 'prayer_location';

function toMins(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function addMins(t: string, mins: number): string {
  const total = (toMins(t) + mins + 1440) % 1440;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

export default function PrayerTimes() {
  const [prayers,    setPrayers]    = useState<PrayerData[]>([]);
  const [forbidden,  setForbidden]  = useState<ForbiddenTime[]>([]);
  const [nextIdx,    setNextIdx]    = useState(-1);
  const [countdown,  setCountdown]  = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [division,   setDivision]   = useState(DEFAULT_DIVISION);
  const [district,   setDistrict]   = useState(DEFAULT_DISTRICT);
  const [savedLoc,   setSavedLoc]   = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const buildPrayers = useCallback((t: Record<string, string>): PrayerData[] => {
    const raw = [
      { key: 'Fajr',    name: 'ফজর',    arabic: 'الفجر',  icon: 'night',     start: t.Fajr    },
      { key: 'Dhuhr',   name: 'যোহর',   arabic: 'الظهر',  icon: 'sun',       start: t.Dhuhr   },
      { key: 'Asr',     name: 'আসর',    arabic: 'العصر',  icon: 'cloud-sun', start: t.Asr     },
      { key: 'Maghrib', name: 'মাগরিব', arabic: 'المغرب', icon: 'sunset',    start: t.Maghrib },
      { key: 'Isha',    name: 'ইশা',    arabic: 'العشاء', icon: 'night',     start: t.Isha    },
    ];
    return raw.map((p, i) => ({ ...p, end: raw[(i + 1) % raw.length].start }));
  }, []);

  const buildForbidden = useCallback((t: Record<string, string>): ForbiddenTime[] => {
    const sunrise = t.Sunrise || addMins(t.Fajr, 90);
    const sunset  = t.Sunset  || addMins(t.Maghrib, -15);
    return [
      { name: 'সূর্যোদয়',       subtitle: 'সূর্য উঠার পর ১৫ মিনিট পর্যন্ত',    icon: 'sun', start: sunrise,              end: addMins(sunrise, 15) },
      { name: 'দুপুর (ইস্তিওয়া)', subtitle: 'সূর্য মাথার ঠিক উপরে থাকার সময়', icon: 'sun', start: addMins(t.Dhuhr, -6), end: t.Dhuhr              },
      { name: 'সূর্যাস্ত',        subtitle: 'সূর্য ডোবার আগের ১৫ মিনিট',        icon: 'sun', start: addMins(sunset, -15),  end: sunset               },
    ];
  }, []);

  const startTimer = useCallback((ps: PrayerData[]) => {
    if (timerRef.current) clearInterval(timerRef.current);
    function tick() {
      const now  = new Date();
      const nowM = now.getHours() * 60 + now.getMinutes();
      let idx = ps.findIndex((p, i) => {
        const start = toMins(p.start);
        const end   = toMins(ps[(i + 1) % ps.length].start);
        if (start < end) return nowM >= start && nowM < end;
        return nowM >= start || nowM < end;
      });
      if (idx === -1) idx = 0;
      const nextI = (idx + 1) % ps.length;
      setNextIdx(nextI);
      const nextMins = toMins(ps[nextI].start);
      let diffSecs = nextMins * 60 - (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds());
      if (diffSecs < 0) diffSecs += 86400;
      const h = Math.floor(diffSecs / 3600);
      const m = Math.floor((diffSecs % 3600) / 60);
      const s = diffSecs % 60;
      setCountdown(`${toBn(h)} ঘণ্টা ${toBn(String(m).padStart(2,'0'))} মিনিট ${toBn(String(s).padStart(2,'0'))} সেকেন্ড`);
    }
    tick();
    timerRef.current = setInterval(tick, 1000);
  }, []);

  const fetchTimes = useCallback(async (lat: number, lng: number, locLabel: string, div: string, dist: string) => {
    setLoading(true);
    setError('');
    try {
      const d   = new Date();
      const url = `https://api.aladhan.com/v1/timings/${d.getDate()}-${d.getMonth()+1}-${d.getFullYear()}?latitude=${lat}&longitude=${lng}&method=1`;
      const res  = await fetch(url);
      const data = await res.json();
      const t    = data.data.timings as Record<string, string>;
      const ps   = buildPrayers(t);
      const fb   = buildForbidden(t);
      setPrayers(ps);
      setForbidden(fb);
      setSavedLoc(locLabel);
      startTimer(ps);
      // localStorage-এ সেভ
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({ division: div, district: dist, locLabel }));
      } catch {}
    } catch {
      setError('নামাজের সময় লোড করা যায়নি');
    } finally {
      setLoading(false);
    }
  }, [buildPrayers, buildForbidden, startTimer]);

  // প্রথমবার লোড — localStorage থেকে পড়ো, না থাকলে default Sirajganj
  useEffect(() => {
    let div  = DEFAULT_DIVISION;
    let dist = DEFAULT_DISTRICT;
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.division && parsed.district && DISTRICTS[parsed.division]?.[parsed.district]) {
          div  = parsed.division;
          dist = parsed.district;
        }
      }
    } catch {}
    setDivision(div);
    setDistrict(dist);
    const coords = DISTRICTS[div][dist];
    fetchTimes(coords[0], coords[1], `${dist}, ${div}`, div, dist);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyManual() {
    const coords = DISTRICTS[division]?.[district];
    if (coords) {
      fetchTimes(coords[0], coords[1], `${district}, ${division}`, division, district);
      setShowPicker(false);
    }
  }

  const districts  = Object.keys(DISTRICTS[division] || {});
  const nextPrayer = prayers[nextIdx];

  return (
    <div className="space-y-5">

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 rounded-3xl p-5 overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8" />
        <div className="absolute top-3 right-5 text-5xl opacity-10 font-arabic select-none">هلال</div>

        {loading ? (
          <div className="py-4 text-center">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            <p className="text-primary-300 text-sm mt-3">লোড হচ্ছে...</p>
          </div>
        ) : error ? (
          <div className="py-4 text-center">
            <p className="text-red-300 text-sm mb-3">{error}</p>
            <button onClick={applyManual} className="text-white text-sm mx-auto bg-white/10 px-4 py-2 rounded-xl">
              আবার চেষ্টা করুন
            </button>
          </div>
        ) : nextPrayer ? (
          <>
            <p className="text-primary-300 text-xs mb-1">পরবর্তী নামাজ</p>
            <h2 className="text-white text-3xl font-bold mb-1">{nextPrayer.name}</h2>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">⏰</span>
              <span className="text-white font-semibold text-lg">{toBn(nextPrayer.start)}</span>
            </div>
            <div className="inline-flex items-center bg-black/25 backdrop-blur-sm rounded-2xl px-4 py-2">
              <span className="text-white font-mono font-semibold text-sm">{countdown}</span>
              <span className="text-primary-300 text-xs ml-2">পরে</span>
            </div>
            {savedLoc && (
              <p className="text-primary-400 text-xs mt-3 flex items-center gap-1">
                <MapPin size={11} /> {savedLoc}
              </p>
            )}
          </>
        ) : null}
      </div>

      {/* Location picker toggle */}
      <button
        onClick={() => setShowPicker(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-2xl border border-gray-200 shadow-sm text-sm font-medium text-gray-600"
      >
        <span className="flex items-center gap-2">
          <MapPin size={15} className="text-primary-600" />
          {savedLoc || 'জেলা বেছে নিন'}
        </span>
        {showPicker ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {showPicker && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">বিভাগ</label>
            <select
              value={division}
              onChange={(e) => {
                const div = e.target.value;
                setDivision(div);
                setDistrict(Object.keys(DISTRICTS[div])[0]);
              }}
              className="input-field"
            >
              {Object.keys(DISTRICTS).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">জেলা</label>
            <select value={district} onChange={(e) => setDistrict(e.target.value)} className="input-field">
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <button
            onClick={applyManual}
            className="w-full py-2.5 rounded-xl bg-primary-700 text-white text-sm font-semibold"
          >
            সময়সূচি দেখুন
          </button>
        </div>
      )}

      {/* Prayer schedule */}
      {prayers.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-500 mb-3">ওয়াক্তের সময়সূচি</p>
          <div className="space-y-2.5">
            {prayers.map((p, i) => {
              const isNext = i === nextIdx;
              return (
                <div key={p.key}
                  className={`flex items-center gap-4 px-4 py-4 rounded-2xl border transition-all ${
                    isNext ? 'bg-primary-50 border-primary-200 shadow-sm' : 'bg-white border-gray-100'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isNext ? 'bg-primary-100' : 'bg-gray-50'}`}>
                    <PrayerIcon icon={p.icon} className={isNext ? 'text-primary-700' : 'text-gray-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-base leading-tight ${isNext ? 'text-primary-800' : 'text-gray-800'}`}>{p.name}</p>
                    <p className="text-xs text-gray-400 font-arabic mt-0.5">{p.arabic}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-bold text-sm tabular-nums ${isNext ? 'text-primary-700' : 'text-gray-700'}`}>
                      {toBn(p.start)} – {toBn(p.end)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">শুরু – শেষ</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Forbidden times */}
      {forbidden.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-500 mb-3">নামাজের নিষিদ্ধ সময়</p>
          <div className="bg-primary-800 rounded-2xl p-4">
            <p className="text-white text-sm font-semibold mb-3">এই সময়গুলোতে নামাজ পড়া নিষিদ্ধ</p>
            <div className="space-y-3">
              {forbidden.map((f) => (
                <div key={f.name} className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <PrayerIcon icon={f.icon} className="text-white/80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold leading-tight">{f.name}</p>
                    <p className="text-primary-300 text-xs mt-0.5">{f.subtitle}</p>
                  </div>
                  <p className="text-primary-200 text-sm font-bold tabular-nums flex-shrink-0">
                    {toBn(f.start)} – {toBn(f.end)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading && prayers.length === 0 && (
        <div className="space-y-2.5">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      )}
    </div>
  );
}
