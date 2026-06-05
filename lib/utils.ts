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
  const jd =
    Math.floor((14 + 12 * d.getFullYear() - Math.floor((14 - (d.getMonth() + 1)) / 12)) / 12) +
    d.getDate() +
    Math.floor(
      (153 * ((d.getMonth() + 1) + 12 * Math.floor((14 - (d.getMonth() + 1)) / 12) - 3) + 2) / 5
    ) +
    365 * (d.getFullYear() + 4800 - Math.floor((14 - (d.getMonth() + 1)) / 12)) +
    Math.floor((d.getFullYear() + 4800 - Math.floor((14 - (d.getMonth() + 1)) / 12)) / 4) -
    Math.floor((d.getFullYear() + 4800 - Math.floor((14 - (d.getMonth() + 1)) / 12)) / 100) +
    Math.floor((d.getFullYear() + 4800 - Math.floor((14 - (d.getMonth() + 1)) / 12)) / 400) -
    32045;
  const l  = jd - 1948440 + 10632;
  const n  = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j  = Math.floor((10985 - l2) / 5316) * Math.floor(50 * l2 / 17719) +
             Math.floor(l2 / 5670) * Math.floor(43 * l2 / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor(17719 * j / 50) -
             Math.floor(j / 16) * Math.floor(15238 * j / 43) + 29;
  const hMonth = Math.floor(24 * l3 / 709);
  const hDay   = l3 - Math.floor(709 * hMonth / 24);
  const hYear  = 30 * n + j - 30;

  const hijriMonths = [
    'মুহাররম', 'সফর', 'রবিউল আউয়াল', 'রবিউস সানি',
    'জমাদিউল আউয়াল', 'জমাদিউস সানি', 'রজব', 'শাবান',
    'রমজান', 'শাওয়াল', 'জিলকদ', 'জিলহজ',
  ];
  return `${toBn(hDay)} ${hijriMonths[hMonth - 1]} ${toBn(hYear)} হিজরি`;
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
