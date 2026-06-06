'use client';

import { useState } from 'react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { Download, X } from 'lucide-react';

export default function InstallBanner() {
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);
  const [loading,   setLoading]   = useState(false);

  if (!isInstallable || isInstalled || dismissed) return null;

  async function handleInstall() {
    setLoading(true);
    const accepted = await promptInstall();
    if (!accepted) setLoading(false);
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-lg mx-auto animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl border border-primary-100 p-4 flex items-center gap-3">

        {/* Logo */}
        <div className="w-12 h-12 bg-primary-700 rounded-xl flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-lg font-arabic">ع</span>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">অ্যাপ ইনস্টল করুন</p>
          <p className="text-xs text-gray-500 mt-0.5">অফলাইনেও ব্যবহার করুন</p>
        </div>

        {/* Install button */}
        <button
          onClick={handleInstall}
          disabled={loading}
          className="flex items-center gap-1.5 bg-primary-700 text-white text-xs font-semibold px-3 py-2 rounded-xl shrink-0 transition-all active:scale-95 disabled:opacity-70"
        >
          {loading
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><Download size={14} /> ইনস্টল</>
          }
        </button>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
