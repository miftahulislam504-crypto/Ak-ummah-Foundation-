'use client';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex flex-col items-center justify-center gap-6">

      {/* Logo */}
      <div className="w-20 h-20 bg-gold-500 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse-slow">
        <span className="text-3xl font-bold text-white font-arabic">ع</span>
      </div>

      {/* Spinner */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-primary-600 border-t-gold-400 rounded-full animate-spin" />
        <p className="text-primary-300 text-sm">লোড হচ্ছে...</p>
      </div>

    </div>
  );
}
