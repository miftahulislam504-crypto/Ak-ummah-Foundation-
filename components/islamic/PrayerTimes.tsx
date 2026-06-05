'use client';

import { useEffect, useState, useCallback } from 'react';
import { toBn, getBanglaDate } from '@/lib/utils';
import { MapPin, RefreshCw, ChevronDown } from 'lucide-react';

interface PrayerTime {
  name:   string;
  nameEn: string;
  time:   string;
  isMakruh?: boolean;
}

const DIVISIONS: Record<string, Record<string, [number, number]>> = {
  'ঢাকা':     { 'ঢাকা': [23.8103, 90.4125], 'নারায়ণগঞ্জ': [23.6238, 90.4997], 'গাজীপুর': [24.0022, 90.4264], 'মানিকগঞ্জ': [23.8630, 89.8690] },
  'চট্টগ্রাম': { 'চট্টগ্রাম': [22.3569, 91.7832], 'কক্সবাজার': [21.4272, 92.0058], 'কুমিল্লা': [23.4607, 91.1809], 'ফেনী': [23.0231, 91.3966] },
  'রাজশাহী':  { 'রাজশাহী': [24.3745, 88.6042], 'বগুড়া': [24.8510, 89.3697], 'নওগাঁ': [24.8008, 88.9415], 'নাটোর': [24.4220, 88.9990] },
  'খুলনা':    { 'খুলনা': [22.8456, 89.5403], 'যশোর': [23.1667, 89.2167], 'সাতক্ষীরা': [22.7185, 89.0705], 'বাগেরহাট': [22.6602, 89.7854] },
  'বরিশাল':   { 'বরিশাল': [22.7010, 90.3535], 'পটুয়াখালী': [22.3596, 90.3298], 'ভোলা': [22.6859, 90.6482], 'ঝালকাঠি': [22.6404, 90.1979] },
  'সিলেট':    { 'সিলেট': [24.8949, 91.8687], 'মৌলভীবাজার': [24.4829, 91.7774], 'সুনামগঞ্জ': [25.0658, 91.3950], 'হবিগঞ্জ': [24.3745, 91.4156] },
  'ময়মনসিংহ': { 'ময়মনসিংহ': [24.7471, 90.4203], 'নেত্রকোনা': [24.8703, 90.7279], 'জামালপুর': [24.9375, 89.9378], 'শেরপুর': [25.0194, 90.0147] },
  'রংপুর':    { 'রংপুর': [25.7439, 89.2752], 'দিনাজপুর': [25.6279, 88.6338], 'গাইবান্ধা': [25.3288, 89.5287], 'কুড়িগ্রাম': [25.8078, 89.6361] },
};

const PRAYER_NAMES = [
  { nameEn: 'Fajr',    name: 'ফজর'   },
  { nameEn: 'Sunrise', name: 'সূর্যোদয়', isMakruh: true },
  { nameEn: 'Dhuhr',   name: 'যোহর'  },
  { nameEn: 'Asr',     name: 'আসর'   },
  { nameEn: 'Sunset',  name: 'সূর্যাস্ত', isMakruh: true },
  { nameEn: 'Maghrib', name: 'মাগরিব'},
  { nameEn: 'Isha',    name: 'এশা'   },
];

export default function PrayerTimes() {
  const [prayers,    setPrayers]    = useState<PrayerTime[]>([]);
  const [location,   setLocation]   = useState('');
  const [countdown,  setCountdown]  = useState('');
  const [nextPrayer, setNextPrayer] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [division,   setDivision]   = useState('ঢাকা');
  const [district,   setDistrict]   = useState('ঢাকা');

  const fetchPrayerTimes = useCallback(async (lat: number, lng: number, locName: string) => {
    setLoading(true);
    setError('');
    try {
      const today = new Date();
      const res   = await fetch(
        `https://api.aladhan.com/v1/timings/${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}?latitude=${lat}&longitude=${lng}&method=1`
      );
      const data  = await res.json();
      const t     = data.data.timings;

      const times: PrayerTime[] = PRAYER_NAMES.map(p => ({
        ...p,
        time: t[p.nameEn] || '--:--',
      }));

      setPrayers(times);
      setLocation(locName);
      startCountdownTimer(times);
    } catch {
      setError('নামাজের সময় লোড করা যায়নি');
    } finally {
      setLoading(false);
    }
  }, []);

  function startCountdownTimer(times: PrayerTime[]) {
    const now      = new Date();
    const nowMins  = now.getHours() * 60 + now.getMinutes();
    const prayerMins = times
      .filter(p => !p.isMakruh)
      .map(p => {
        const [h, m] = p.time.split(':').map(Number);
        return { name: p.name, mins: h * 60 + m };
      });

    const next = prayerMins.find(p => p.mins > nowMins) || prayerMins[0];
    setNextPrayer(next.name);

    const interval = setInterval(() => {
      const n    = new Date();
      const diff = (next.mins * 60) - (n.getHours() * 3600 + n.getMinutes() * 60 + n.getSeconds());
      const abs  = Math.abs(diff);
      const h    = Math.floor(abs / 3600);
      const m    = Math.floor((abs % 3600) / 60);
      const s    = abs % 60;
      setCountdown(`${toBn(h)}:${toBn(String(m).padStart(2, '0'))}:${toBn(String(s).padStart(2, '0'))}`);
    }, 1000);

    return () => clearInterval(interval);
  }

  function getGPS() {
    if (!navigator.geolocation) { setError('GPS সমর্থিত নয়'); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.county || 'আপনার অবস্থান';
          fetchPrayerTimes(lat, lng, city);
        } catch {
          fetchPrayerTimes(lat, lng, 'আপনার অবস্থান');
        }
      },
      () => { setError('অবস্থান পাওয়া যায়নি'); setLoading(false); }
    );
  }

  function applyManual() {
    const coords = DIVISIONS[division]?.[district];
    if (coords) fetchPrayerTimes(coords[0], coords[1], `${district}, ${division}`);
  }

  useEffect(() => { getGPS(); }, []);

  const districts = Object.keys(DIVISIONS[division] || {});

  return (
    <div className="space-y-4">

      {/* Countdown */}
      {nextPrayer && countdown && (
        <div className="card-green text-center py-5">
          <p className="text-primary-200 text-sm">পরবর্তী নামাজ — {nextPrayer}</p>
          <p className="text-white text-4xl font-bold mt-2 tracking-wider font-mono">{countdown}</p>
          {location && <p className="text-primary-300 text-xs mt-2 flex items-center justify-center gap-1"><MapPin size={12} />{location}</p>}
        </div>
      )}

      {/* Location controls */}
      <div className="card space-y-3">
        <div className="flex gap-2">
          <button
            onClick={getGPS}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${!manualMode ? 'bg-primary-700 text-white border-primary-700' : 'border-gray-200 text-gray-600'}`}
          >
            <MapPin size={16} /> GPS অবস্থান
          </button>
          <button
            onClick={() => setManualMode(!manualMode)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${manualMode ? 'bg-primary-700 text-white border-primary-700' : 'border-gray-200 text-gray-600'}`}
          >
            <ChevronDown size={16} /> জেলা বেছে নিন
          </button>
        </div>

        {manualMode && (
          <div className="space-y-2">
            <select value={division} onChange={(e) => { setDivision(e.target.value); setDistrict(Object.keys(DIVISIONS[e.target.value])[0]); }} className="input-field">
              {Object.keys(DIVISIONS).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={district} onChange={(e) => setDistrict(e.target.value)} className="input-field">
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <button onClick={applyManual} className="btn-primary w-full text-sm py-2.5">সময়সূচি দেখুন</button>
          </div>
        )}
      </div>

      {/* Prayer list */}
      {error ? (
        <div className="card text-center py-6">
          <p className="text-red-500 text-sm mb-3">{error}</p>
          <button onClick={getGPS} className="flex items-center gap-2 text-primary-700 text-sm mx-auto">
            <RefreshCw size={14} /> আবার চেষ্টা করুন
          </button>
        </div>
      ) : loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="card h-14 animate-pulse" />)}
        </div>
      ) : (
        <div className="card divide-y divide-gray-50">
          {prayers.map((p) => (
            <div key={p.nameEn} className={`flex items-center justify-between py-3.5 ${p.isMakruh ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-3">
                {p.isMakruh && <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">মাকরুহ</span>}
                <span className={`text-sm font-medium ${p.isMakruh ? 'text-gray-400' : 'text-gray-800'}`}>{p.name}</span>
              </div>
              <span className={`text-base font-bold ${p.name === nextPrayer ? 'text-primary-700' : 'text-gray-700'}`}>
                {toBn(p.time)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
