'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { questions, questionModules, getQuestionsByModule } from '@/lib/questions';

export default function OnboardingPage() {
  const router = useRouter();
  const [currentModule, setCurrentModule] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(false);
  
  const modules = questionModules;
  const currentQuestions = getQuestionsByModule(modules[currentModule].id);
  
  const handleAnswer = (questionId: number, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };
  
  const handleNext = () => {
    if (currentModule < modules.length - 1) {
      setCurrentModule(currentModule + 1);
      window.scrollTo(0, 0);
    } else {
      submitAnswers();
    }
  };
  
  const handlePrev = () => {
    if (currentModule > 0) {
      setCurrentModule(currentModule - 1);
      window.scrollTo(0, 0);
    }
  };
  
  const submitAnswers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      
      if (res.ok) {
        router.push('/discover');
      } else {
        alert('提交失败，请重试');
      }
    } catch (error) {
      alert('网络错误');
    } finally {
      setLoading(false);
    }
  };
  
  const progress = ((currentModule + 1) / modules.length) * 100;
  const isModuleComplete = currentQuestions.every(q => answers[q.id] !== undefined);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* 进度条 */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200">
        <div 
          className="h-full bg-purple-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 模块标题 */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">{modules[currentModule].icon}</div>
          <h1 className="text-2xl font-bold">{modules[currentModule].name}</h1>
          <p className="text-gray-500">
            模块 {currentModule + 1}/{modules.length} · 共{currentQuestions.length}题
          </p>
        </div>
        
        {/* 问题列表 */}
        <div className="space-y-6">
          {currentQuestions.map((q) => (
            <div key={q.id} className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-medium mb-4">
                {q.id}. {q.text}
                {q.weight > 2 && <span className="ml-2 text-red-500 text-sm">(重要)</span>}
              </h3>
              
              {/* 量表题 (1-5分) */}
              {q.type === 'scale' && (
                <div>
                  <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <span>不认同</span>
                    <span>非常认同</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    {[1,2,3,4,5].map(num => (
                      <button
                        key={num}
                        onClick={() => handleAnswer(q.id, num)}
                        className={`flex-1 h-12 rounded-lg border-2 transition
                          ${answers[q.id] === num 
                            ? 'border-purple-600 bg-purple-600 text-white' 
                            : 'border-gray-200 hover:border-purple-400'}`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 单选题 */}
              {q.type === 'single' && q.options && (
                <div className="space-y-2">
                  {q.options.map(opt => (
                    <label key={opt} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-purple-50">
                      <input
                        type="radio"
                        name={`q${q.id}`}
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={(e) => handleAnswer(q.id, e.target.value)}
                        className="mr-3"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}
              
              {/* 多选题 */}
              {q.type === 'multiple' && q.options && (
                <div className="space-y-2">
                  {q.options.map(opt => (
                    <label key={opt} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-purple-50">
                      <input
                        type="checkbox"
                        value={opt}
                        checked={answers[q.id]?.includes(opt) || false}
                        onChange={(e) => {
                          const current = answers[q.id] || [];
                          const newValue = e.target.checked
                            ? [...current, opt]
                            : current.filter((v: string) => v !== opt);
                          handleAnswer(q.id, newValue);
                        }}
                        className="mr-3"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}
              
              {/* 文本题 */}
              {q.type === 'text' && (
                <textarea
                  value={answers[q.id] || ''}
                  onChange={(e) => handleAnswer(q.id, e.target.value)}
                  placeholder="请输入..."
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              )}
            </div>
          ))}
        </div>
        
        {/* 底部说明 */}
        <div className="mt-6 text-xs text-gray-400 text-center">
          你的详细回答不会对其他用户展示，只会用于AI计算价值观画像和匹配度。
          我们不会将这些数据用于广告或推荐以外的用途。
        </div>
        
        {/* 导航按钮 */}
        <div className="mt-8 flex justify-between">
          {currentModule > 0 && (
            <button
              onClick={handlePrev}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              上一模块
            </button>
          )}
          
          <button
            onClick={handleNext}
            disabled={!isModuleComplete || loading}
            className={`ml-auto px-8 py-3 bg-purple-600 text-white rounded-lg
              ${(!isModuleComplete || loading) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-700'}`}
          >
            {currentModule === modules.length - 1 
              ? (loading ? '提交中...' : '完成测试') 
              : '下一模块'}
          </button>
        </div>
        
        {/* 模块完成提示 */}
        {!isModuleComplete && (
          <p className="mt-4 text-sm text-orange-500 text-center">
            请完成当前模块所有题目后再继续
          </p>
        )}
      </div>
    </div>
  );
}