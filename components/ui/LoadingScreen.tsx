'use client';

import Image from 'next/image';

interface LoadingScreenProps {
  /** true = full-screen initial load, false = page-transition overlay */
  overlay?: boolean;
}

export default function LoadingScreen({ overlay = false }: LoadingScreenProps) {
  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
        <LogoSpinner size={56} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex flex-col items-center justify-center gap-8">
      <LogoSpinner size={72} />
      <div className="flex flex-col items-center gap-2">
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

/** Reusable spinning-ring-around-logo component */
export function LogoSpinner({ size = 64 }: { size?: number }) {
  const ring1 = size * 1.6;
  const ring2 = size * 1.35;
  const ring3 = size * 1.1;

  return (
    <div className="relative flex items-center justify-center" style={{ width: ring1, height: ring1 }}>
      {/* Outer pulse ring */}
      <span
        className="absolute rounded-full border-2 border-primary-400/30 animate-ping"
        style={{ width: ring1, height: ring1 }}
      />
      {/* Middle slow-spin dashed ring */}
      <span
        className="absolute rounded-full border-2 border-dashed border-gold-400/40 animate-spin"
        style={{ width: ring2, height: ring2, animationDuration: '3s' }}
      />
      {/* Inner fast arc */}
      <span
        className="absolute rounded-full border-2 border-transparent border-t-gold-400 border-r-gold-400/50 animate-spin"
        style={{ width: ring3, height: ring3, animationDuration: '0.9s' }}
      />
      {/* Logo image */}
      <div
        className="relative rounded-2xl overflow-hidden shadow-lg shadow-gold-500/30 z-10 bg-white"
        style={{ width: size, height: size }}
      >
        <Image
          src="/logo.png"
          alt="এক উম্মাহ"
          fill
          className="object-contain p-1"
          priority
          unoptimized
        />
      </div>
    </div>
  );
}
