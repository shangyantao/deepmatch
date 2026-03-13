import type { Metadata } from "next";
import { Inter } from "next/font/google"; 
import "./globals.css";
import { Providers } from './providers';
import NavBar from '@/components/NavBar';
import { ToastProvider } from '@/components/Toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "DeepMatch · 深度价值观配对",
  description: "一个帮你找到真正价值观契合对象的 AI 交友产品。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <ErrorBoundary>
          <Providers>
            <ToastProvider>  {/* ToastProvider 必须在所有使用 useToast 的组件外面 */}
              <div className="pb-20 min-h-screen">
                {children}
              </div>
              <NavBar />
            </ToastProvider>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}