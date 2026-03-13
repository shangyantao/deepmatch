'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function MatchDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  useEffect(() => {
    // 从API获取数据
    fetchMatchDetail();
  }, [id]);
  
  const fetchMatchDetail = async () => {
    try {
      // 先获取匹配列表，找到当前匹配的详情
      const res = await fetch('/api/matches/daily');
      const data = await res.json();
      const currentMatch = data.matches.find((m: any) => m.id === Number(id));
      
      if (currentMatch) {
        setMatch({
          ...currentMatch,
          commonValues: ['家庭', '自由', '健康'], // 可以后续从API获取
        });
      }
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const submitFeedback = async (feedback: number) => {
    try {
      const res = await fetch('/api/matches/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchedUserId: Number(id),
          feedback
        })
      });
      
      if (res.ok) {
        setFeedbackSubmitted(true);
        setTimeout(() => setShowFeedback(false), 2000);
      }
    } catch (error) {
      console.error('提交反馈失败:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">加载中...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <button 
          onClick={() => router.back()}
          className="mb-4 text-purple-600 flex items-center"
        >
          ← 返回
        </button>
        
        {/* 用户卡片 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
              👤
            </div>
            
            <h1 className="text-2xl font-bold mb-2">{match?.name}</h1>
            <p className="text-gray-500 mb-4">{match?.phone}</p>
            
            {/* 匹配度 */}
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">匹配度</span>
                <span className="font-bold text-purple-600">{match?.similarity}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
                  style={{ width: `${match?.similarity}%` }}
                />
              </div>
            </div>
            
            {/* 匹配理由 */}
            <p className="text-sm text-purple-600 bg-purple-50 p-3 rounded-lg mb-4">
              {match?.reason}
            </p>
            
            {/* 共同价值观 */}
            <div className="text-left mb-6">
              <h3 className="font-semibold mb-3">共同价值观</h3>
              <div className="flex flex-wrap gap-2">
                {match?.commonValues?.map((v: string) => (
                  <span key={v} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                    {v}
                  </span>
                ))}
              </div>
            </div>
            
            {/* 操作按钮 */}
            <div className="space-y-3">
              <button onClick={() => router.push(`/chat/${match.id}`)} className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                发送消息
              </button>
              
              {/* 反馈按钮 */}
              <button
                onClick={() => setShowFeedback(!showFeedback)}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                你们聊得怎么样？
              </button>
              
              {/* 反馈选项 */}
              {showFeedback && (
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <p className="text-sm text-gray-600 mb-2">告诉我们，帮我们改进匹配：</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => submitFeedback(1)}
                      disabled={feedbackSubmitted}
                      className="p-2 text-sm bg-white border rounded-lg hover:bg-gray-100"
                    >
                      ❌ 还没聊
                    </button>
                    <button
                      onClick={() => submitFeedback(2)}
                      disabled={feedbackSubmitted}
                      className="p-2 text-sm bg-white border rounded-lg hover:bg-gray-100"
                    >
                      😕 聊过，一般
                    </button>
                    <button
                      onClick={() => submitFeedback(3)}
                      disabled={feedbackSubmitted}
                      className="p-2 text-sm bg-white border rounded-lg hover:bg-gray-100"
                    >
                      👍 聊得不错
                    </button>
                    <button
                      onClick={() => submitFeedback(4)}
                      disabled={feedbackSubmitted}
                      className="p-2 text-sm bg-white border rounded-lg hover:bg-gray-100"
                    >
                      🤝 见面了
                    </button>
                  </div>
                  {feedbackSubmitted && (
                    <p className="text-sm text-green-600 text-center">感谢反馈！</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* AI 共同点分析 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold mb-3">AI 共同点分析</h3>
          <p className="text-gray-600">
            {match?.reason} 你们在价值观和生活习惯上有很多相似之处，
            很可能会聊得来。
          </p>
        </div>
      </div>
    </div>
  );
}