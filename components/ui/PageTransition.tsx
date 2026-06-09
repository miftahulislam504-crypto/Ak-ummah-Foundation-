'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { LogoSpinner } from './LoadingScreen';

/**
 * Shows a small logo spinner overlay whenever the route changes.
 * Drop this inside MainLayout (or RootLayout).
 */
export default function PageTransition() {
  const pathname   = usePathname();
  const [show, setShow] = useState(false);
  const prevPath   = useRef(pathname);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pathname !== prevPath.current) {
      prevPath.current = pathname;
      setShow(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setShow(false), 600);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [pathname]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-xl">
        <LogoSpinner size={48} />
      </div>
    </div>
  );
}
