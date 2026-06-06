'use client';

import { useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';
import InstallBanner from '@/components/pwa/InstallBanner';

export default function PWAProvider({ children }: { children: React.ReactNode }) {
  usePWA();

  return (
    <>
      {children}
      <InstallBanner />
    </>
  );
}
