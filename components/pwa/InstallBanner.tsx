'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, Download } from 'lucide-react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

const DISMISS_KEY = 'eu_pwa_banner_dismissed';

export default function InstallBanner() {
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (!isInstallable || isInstalled) {
      setVisible(false);
      return;
    }
    const dismissed = sessionStorage.getItem(DISMISS_KEY);
    if (!dismissed) setVisible(true);
  }, [isInstallable, isInstalled]);

  async function handleInstall() {
    setInstalling(true);
    const accepted = await promptInstall();
    setInstalling(false);
    if (accepted) setVisible(false);
  }

  function handleDismiss() {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] p-3 animate-slide-up">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl overflow-hidden shadow shrink-0">
          <Image
            src="/logo.png"
            alt="এক উম্মাহ ফাউন্ডেশন"
            width={44}
            height={44}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">অ্যাপ ইনস্টল করুন</p>
          <p className="text-xs text-gray-500 mt-0.5">হোম স্ক্রিনে যোগ করে সহজে অ্যাক্সেস করুন</p>
        </div>

        <button
          onClick={handleInstall}
          disabled={installing}
          className="bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 shrink-0"
        >
          {installing ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Download size={15} />
              ইনস্টল
            </>
          )}
        </button>

        <button
          onClick={handleDismiss}
          className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 shrink-0"
          aria-label="বন্ধ করুন"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
