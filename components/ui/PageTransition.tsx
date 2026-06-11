'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Shows a simple spinner overlay whenever the route changes.
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
      timerRef.current = setTimeout(() => setShow(false), 500);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [pathname]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
        <div className="w-9 h-9 border-[3px] border-primary-200 border-t-primary-700 rounded-full animate-spin" />
      </div>
    </div>
  );
}
