'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Crush {
  id: number;
  user_id: number;
  target_user_id: number;
  is_mutual: boolean;
  name: string;
  phone: string;
}

interface MutualMatch {
  id: number;
  user1_id: number;
  user2_id: number;
  matched_at: string;
  user1_name: string;
  user2_name: string;
  is_read: boolean;
}

export default function CrushesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [myCrushes, setMyCrushes] = useState<Crush[]>([]);
  const [crushedBy, setCrushedBy] = useState<Crush[]>([]);
  const [mutualMatches, setMutualMatches] = useState<MutualMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  useEffect(() => {
    fetchCrushes();
  }, []);
  
  const fetchCrushes = async () => {
    try {
      const res = await fetch('/api/crushes');
      const data = await res.json();
      
      if (res.ok) {
        setMyCrushes(data.myCrushes || []);
        setCrushedBy(data.crushedBy || []);
        setMutualMatches(data.mutualMatches || []);
      }
    } catch (error) {
      console.error('加载暗恋数据失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const searchUsers = async () => {
    if (!searchTerm.trim()) return;
    
    setSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchTerm)}`);
      const data = await res.json();
      
      if (res.ok) {
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error('搜索用户失败:', error);
    } finally {
      setSearching(false);
    }
  };
  
  const submitCrush = async (targetUserId: number) => {
    try {
      const res = await fetch('/api/crushes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        if (data.mutual) {
          alert('🎉 恭喜！你们互相暗恋！快去聊天吧！');
        } else {
          alert('✅ 暗恋已发送，静待佳音');
        }
        setShowAddModal(false);
        setSearchTerm('');
        setSearchResults([]);
        fetchCrushes();
      } else {
        alert(data.error || '提交失败');
      }
    } catch (error) {
      console.error('提交暗恋失败:', error);
    }
  };
  
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white">
        <div className="text-center">加载中...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="text-purple-600 mr-3 text-xl"
            >
              ←
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              暗恋
            </h1>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-sm"
          >
            + 添加暗恋
          </button>
        </div>
        
        {/* 互相暗恋匹配 - 最优先展示 */}
        {mutualMatches.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-gray-400 mb-3 flex items-center">
              <span className="text-lg mr-2">🎉</span> 互相暗恋成功！
            </h2>
            <div className="space-y-3">
              {mutualMatches.map((match) => {
                const isMe = match.user1_id === parseInt(session?.user?.id || '0');
                const otherName = isMe ? match.user2_name : match.user1_name;
                return (
                  <div key={match.id} className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-4 border border-pink-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center text-white text-xl">
                          💕
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">和 {otherName} 互相暗恋！</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(match.matched_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/chat/${isMe ? match.user2_id : match.user1_id}`}
                        className="px-4 py-2 bg-purple-600 text-white rounded-full text-sm"
                      >
                        去聊天
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* 暗恋我的人 */}
        {crushedBy.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-gray-400 mb-3">有人暗恋你</h2>
            <div className="space-y-2">
              {crushedBy.map((crush) => (
                <div key={crush.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                        👤
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">有人暗恋你...</p>
                        <p className="text-xs text-gray-400">点击查看线索</p>
                      </div>
                    </div>
                    <button className="text-purple-600 text-sm">查看线索</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 我暗恋的人 */}
        {myCrushes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-gray-400 mb-3">我暗恋的人</h2>
            <div className="space-y-2">
              {myCrushes.map((crush) => (
                <div key={crush.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                        👤
                      </div>
                      <div>
                        <p className="font-medium">{crush.name || crush.phone}</p>
                        <p className="text-xs text-gray-400">
                          {crush.is_mutual ? '✨ 互相暗恋' : '等待回应...'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 空状态 */}
        {myCrushes.length === 0 && crushedBy.length === 0 && mutualMatches.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💘</div>
            <p className="text-gray-500">还没有暗恋记录</p>
            <p className="text-sm text-gray-400 mt-2">
              添加你暗恋的人，如果 Ta 也暗恋你，就会匹配成功
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl"
            >
              添加暗恋对象
            </button>
          </div>
        )}
      </div>
      
      {/* 添加暗恋模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">添加暗恋对象</h3>
            
            <div className="mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                placeholder="输入手机号或昵称"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={searchUsers}
                disabled={searching}
                className="w-full mt-2 py-2 bg-purple-600 text-white rounded-xl"
              >
                {searching ? '搜索中...' : '搜索'}
              </button>
            </div>
            
            <div className="max-h-64 overflow-y-auto mb-4">
              {searchResults.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border-b">
                  <div>
                    <p className="font-medium">{user.name || user.phone}</p>
                    <p className="text-sm text-gray-400">{user.phone}</p>
                  </div>
                  <button
                    onClick={() => submitCrush(user.id)}
                    className="px-4 py-2 bg-pink-500 text-white rounded-full text-sm"
                  >
                    暗恋 Ta
                  </button>
                </div>
              ))}
              {searchResults.length === 0 && searchTerm && !searching && (
                <p className="text-center text-gray-400 py-4">未找到用户</p>
              )}
            </div>
            
            <button
              onClick={() => setShowAddModal(false)}
              className="w-full py-3 border border-gray-300 rounded-xl"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}