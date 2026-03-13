'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface MatchHistoryItem {
  id: number;
  name: string;
  phone: string;
  similarity: number;
  date: string;
}

export default function MatchHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [history, setHistory] = useState<Record<string, MatchHistoryItem[]>>({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  useEffect(() => {
    fetchHistory();
  }, []);
  
  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/matches/history');
      const data = await res.json();
      
      if (res.ok) {
        setHistory(data.history || {});
      }
    } catch (error) {
      console.error('加载匹配历史失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return '今天';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨天';
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: 'numeric',
        day: 'numeric'
      });
    }
  };
  
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
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="text-purple-600 mr-3 text-xl"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            匹配历史
          </h1>
        </div>
        
        {Object.keys(history).length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-gray-500">暂无匹配历史</p>
            <p className="text-sm text-gray-400 mt-2">
              完成价值观测试后，每天都会有新匹配
            </p>
            <Link
              href="/discover"
              className="inline-block mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl"
            >
              去今日匹配
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(history).map(([dateStr, matches]) => (
              <div key={dateStr} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center mb-3">
                  <span className="text-sm font-medium text-gray-400">{dateStr}</span>
                  <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {matches.length} 个匹配
                  </span>
                </div>
                
                <div className="space-y-3">
                  {matches.map((match) => (
                    <div key={match.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center text-lg">
                          👤
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{match.name}</p>
                          <p className="text-xs text-gray-400">{match.phone}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-purple-600">{match.similarity}%</div>
                        <div className="text-xs text-gray-400">{formatDate(match.date)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}