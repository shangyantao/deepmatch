'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [hasCompletedTest, setHasCompletedTest] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // 检查用户是否已完成测试
  useEffect(() => {
    if (!mounted) return;
    
    if (session?.user?.id) {
      fetch('/api/user/test-status')
        .then(res => res.json())
        .then(data => {
          setHasCompletedTest(data.completed);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [session, mounted]);
  
  // 根据状态自动跳转
  useEffect(() => {
    if (!mounted) return;
    
    if (status === 'authenticated' && !loading) {
      if (hasCompletedTest === false) {
        router.push('/onboarding');
      } else if (hasCompletedTest === true) {
        router.push('/discover');
      }
    }
  }, [status, hasCompletedTest, loading, router, mounted]);
  
  // 服务端渲染时显示简单内容
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-md mx-auto px-4 py-12">
          <div className="text-center">加载中...</div>
        </div>
      </div>
    );
  }
  
  // 加载中
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }
  
  // 已登录用户 - 显示不同内容
  if (status === 'authenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-md mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-purple-600">DEEPMATCH</h1>
            <p className="text-gray-500 mt-2">深度价值观配对</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
            <h2 className="text-xl font-semibold mb-4">欢迎回来！</h2>
            {hasCompletedTest === false ? (
              <>
                <p className="text-gray-600 mb-4">你还没有完成价值观测试，完成测试后即可看到今日匹配。</p>
                <Link 
                  href="/onboarding"
                  className="block w-full py-3 bg-purple-600 text-white text-center rounded-lg"
                >
                  开始66题价值观测试
                </Link>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-4">你已经完成测试，去看看今日的深度匹配吧！</p>
                <Link 
                  href="/discover"
                  className="block w-full py-3 bg-purple-600 text-white text-center rounded-lg"
                >
                  查看今日3个深度匹配
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // 未登录用户看到营销页
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-md mx-auto px-4 py-12">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-purple-600">DEEPMATCH</h1>
          <p className="text-gray-500 mt-2">深度价值观配对</p>
        </div>
        
        {/* 英雄区 */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-6 text-center">
          <div className="text-6xl mb-4">🧠</div>
          <h2 className="text-xl font-semibold mb-2">不止是匹配，更是理解</h2>
          <p className="text-gray-600">
            我们会通过66个关于价值观的深度问题，为你描绘一张独一无二的内在画像，
            再用AI为你找出最契合的3位灵魂匹配对象。
          </p>
        </div>
        
        {/* 第一步 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <div className="flex items-center mb-4">
            <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold mr-3">1</span>
            <h3 className="font-semibold">完成66题价值观测试</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            预计5-8分钟完成。问题围绕亲密关系观念、冲突处理方式、成长与自由等关键维度，
            同时兼顾理性与感性。
          </p>
          <Link 
            href="/login"
            className="block w-full py-3 bg-purple-600 text-white text-center rounded-lg hover:bg-purple-700"
          >
            开始价值观测试
          </Link>
        </div>
        
        {/* 第二步 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center mb-4">
            <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold mr-3">2</span>
            <h3 className="font-semibold">查看今日3个深度匹配</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            当你完成价值观测试后，AI会为你生成今日的3个深度匹配。每天刷新一次，
            不鼓励“海量刷人”，只给你真正值得认真聊聊的候选人。
          </p>
          <Link 
            href="/login"
            className="block w-full py-3 border border-purple-600 text-purple-600 text-center rounded-lg hover:bg-purple-50"
          >
            登录后查看
          </Link>
        </div>
        
        {/* 底部说明 */}
        <div className="text-center text-sm text-gray-400">
          <p>我们如何做匹配？</p>
          <p className="mt-1">AI从你的回答中提炼核心价值观标签，并计算向量表示。</p>
          <p>每天为你筛选出价值观高度相似、但性格维度互补的3个人。</p>
        </div>
      </div>
    </div>
  );
}