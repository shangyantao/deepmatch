import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

// 简单的匹配度计算
function calculateMatchScore(answer1: any, answer2: any): number {
  if (!answer1 || !answer2) return 0;
  
  let totalScore = 0;
  let maxScore = 0;
  
  // 只计算共同回答的题目
  const allKeys = new Set([...Object.keys(answer1), ...Object.keys(answer2)]);
  
  for (const key of allKeys) {
    const a1 = answer1[key];
    const a2 = answer2[key];
    
    if (a1 && a2) {
      maxScore += 5;
      
      // 简单比较：相同得5分，不同得0分
      if (JSON.stringify(a1) === JSON.stringify(a2)) {
        totalScore += 5;
      }
    }
  }
  
  return maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }
  
  try {
    const userId = parseInt(session.user.id);
    
    // 获取当前用户的答案
    const userResult = await query('SELECT answers FROM users WHERE id = $1', [userId]);
    const userAnswers = userResult.rows[0]?.answers;
    
    if (!userAnswers) {
      return NextResponse.json({ 
        matches: [],
        message: '请先完成问卷' 
      });
    }
    
    // 获取其他所有用户的答案
    const othersResult = await query(
      'SELECT id, name, phone, answers FROM users WHERE id != $1 AND answers IS NOT NULL',
      [userId]
    );
    
    // 计算匹配度
    const matches = othersResult.rows.map((other: any) => {
      const score = calculateMatchScore(userAnswers, other.answers);
      return {
        id: other.id,
        name: other.name || other.phone,
        phone: other.phone,
        similarity: score,
      };
    });
    
    // 按匹配度排序，取前3个
    const topMatches = matches
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);
    
    return NextResponse.json({ matches: topMatches });
  } catch (error) {
    console.error('获取匹配失败:', error);
    return NextResponse.json(
      { error: '获取失败' },
      { status: 500 }
    );
  }
}