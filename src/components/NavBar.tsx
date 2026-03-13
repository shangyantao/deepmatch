'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function NavBar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // 不在登录页显示导航
  if (pathname === '/login') return null;
  
  // 未登录不显示导航
  if (!session) return null;
  
  // 服务端渲染时不显示，避免水合错误
  if (!mounted) return null;
  
  const navItems = [
    { href: '/discover', label: '匹配', icon: '🔍' },
    { href: '/chat', label: '聊天', icon: '💬' },
    { href: '/profile', label: '我的', icon: '👤' },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4">
      <div className="max-w-md mx-auto flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center px-3 py-1 rounded-lg transition ${
                isActive 
                  ? 'text-purple-600' 
                  : 'text-gray-500 hover:text-purple-600'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}