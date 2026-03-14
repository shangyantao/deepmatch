'use client';

import { SessionProvider } from 'next-auth/react';
import { useState, useEffect } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // 服务端渲染时不渲染 SessionProvider
  if (!mounted) {
    return <>{children}</>;
  }
  
  return <SessionProvider>{children}</SessionProvider>;
}