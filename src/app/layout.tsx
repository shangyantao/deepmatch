import type { Metadata } from "next";
import "./globals.css";
import { Providers } from './providers';
import NavBar from '@/components/NavBar';
import { ToastProvider } from '@/components/Toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';

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
      <body className="font-sans antialiased">
        <ErrorBoundary>
          <Providers>
            <ToastProvider>
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