'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SkeletonCard } from '@/components/Skeleton';

interface Match {
  id: number;
  name: string;
  phone: string;
  similarity: number;
  reason: string;  // 新增：匹配理由字段
}

export default function DiscoverPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  useEffect(() => {
    fetchMatches();
  }, []);
  
  const fetchMatches = async () => {
    try {
      const res = await fetch('/api/matches/daily');
      const data = await res.json();
      
      if (res.ok) {
        setMatches(data.matches || []);
        setMessage(data.message || '');
      } else {
        console.error('加载失败:', data.error);
      }
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const createTestData = async () => {
    try {
      const res = await fetch('/api/matches/seed');
      const data = await res.json();
      if (data.success) {
        alert('测试数据创建成功，请刷新页面');
        fetchMatches();
      }
    } catch (error) {
      console.error('创建测试数据失败:', error);
    }
  };
  
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-md mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mx-auto animate-pulse"></div>
          </div>
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">今日 3 个深度匹配</h1>
          <p className="text-gray-500 mt-2">
            基于你的价值观测试，AI 为你挑选出的最有可能聊得来的 3 个人
          </p>
        </div>
        
        {message && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg text-center mb-4">
            {message}
            <button 
              onClick={createTestData}
              className="block w-full mt-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              创建测试数据
            </button>
          </div>
        )}
        
        <div className="space-y-4">
          {matches.map((match) => (
            <div key={match.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center text-2xl">
                  👤
                </div>
                <div className="flex-1 min-w-0"> {/* min-w-0 防止文本溢出 */}
                  <h3 className="font-semibold text-gray-800 truncate">{match.name}</h3>
                  <p className="text-sm text-gray-500">{match.phone}</p>
                  
                  {/* 新增：匹配理由 - 使用紫色文字显示，单行省略 */}
                  <p className="text-xs text-purple-600 mt-1 truncate">
                    {match.reason || '价值观高度契合'}
                  </p>
                  
                  <div className="flex items-center mt-2">
                    <span className="text-sm font-medium text-purple-600 mr-2">{match.similarity}%</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                        style={{ width: `${match.similarity}%` }}
                      />
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => router.push(`/discover/${match.id}`)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition flex-shrink-0"
                >
                  查看
                </button>
              </div>
            </div>
          ))}
          
          {matches.length === 0 && !message && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">😢</div>
              <p className="text-gray-500">暂无匹配用户</p>
              <button 
                onClick={createTestData}
                className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                创建测试数据
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}