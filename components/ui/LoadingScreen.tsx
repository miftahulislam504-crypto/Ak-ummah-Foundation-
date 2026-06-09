'use client';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex flex-col items-center justify-center gap-8">

      {/* Rings animation */}
      <div className="relative flex items-center justify-center">

        {/* Outer ring */}
        <div className="absolute w-24 h-24 rounded-full border-2 border-primary-600/30 animate-ping" />

        {/* Middle ring */}
        <div className="absolute w-20 h-20 rounded-full border-2 border-gold-400/20 animate-pulse" />

        {/* Spinning arc */}
        <div className="absolute w-16 h-16 rounded-full border-2 border-transparent border-t-gold-400 border-r-gold-400/50 animate-spin" />

        {/* Logo center */}
        <div className="w-12 h-12 bg-gold-500 rounded-xl flex items-center justify-center shadow-lg shadow-gold-500/30 z-10">
          <span className="text-xl font-bold text-white font-arabic">ع</span>
        </div>
      </div>

      {/* Text */}
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-white font-semibold text-base tracking-wide">এক উম্মাহ ফাউন্ডেশন</p>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>

    </div>
  );
}
