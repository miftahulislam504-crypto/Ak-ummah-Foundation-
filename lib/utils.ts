import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ===== Tailwind merge =====
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ===== বাংলা সংখ্যা =====
export function toBn(n: number | string): string {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(n).replace(/[0-9]/g, (d) => bn[parseInt(d)]);
}

// ===== বাংলা তারিখ =====
export function getBanglaDate(date?: Date): string {
  const d = date || new Date();
  const months = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল',
    'মে', 'জুন', 'জুলাই', 'আগস্ট',
    'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
  ];
  const days = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
  return `${days[d.getDay()]}, ${toBn(d.getDate())} ${months[d.getMonth()]} ${toBn(d.getFullYear())}`;
}

// ===== হিজরি তারিখ =====
export function getHijriDate(date?: Date): string {
  const d = date || new Date();

  const hijriMonths = [
    'মুহাররম', 'সফর', 'রবিউল আউয়াল', 'রবিউস সানি',
    'জমাদিউল আউয়াল', 'জমাদিউস সানি', 'রজব', 'শাবান',
    'রমজান', 'শাওয়াল', 'জিলকদ', 'জিলহজ',
  ];

  try {
    const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day:   'numeric',
      month: 'numeric',
      year:  'numeric',
    });
    const parts  = fmt.formatToParts(d);
    const get    = (type: string) => parts.find(p => p.type === type)?.value || '0';
    const hDay   = parseInt(get('day'),   10);
    const hMonth = parseInt(get('month'), 10);
    const hYear  = parseInt(get('year'),  10);
    return `${toBn(hDay)} ${hijriMonths[hMonth - 1]} ${toBn(hYear)} হিজরি`;
  } catch {
    return '';
  }
}

// ===== Random ID =====
export function generateId(prefix = 'EU'): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const rand  = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${prefix}-${rand}`;
}

// ===== Relative time (বাংলায়) =====
export function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);

  if (mins  < 1)   return 'এইমাত্র';
  if (mins  < 60)  return `${toBn(mins)} মিনিট আগে`;
  if (hours < 24)  return `${toBn(hours)} ঘণ্টা আগে`;
  if (days  < 30)  return `${toBn(days)} দিন আগে`;
  return getBanglaDate(new Date(dateStr));
}

// ===== Format currency =====
export function formatTaka(amount: number): string {
  return `৳${toBn(amount.toLocaleString('en-IN'))}`;
}
