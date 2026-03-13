import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

// 计算匹配度（带权重）
function calculateMatchScore(answer1: any, answer2: any): number {
  // ... 保持不变
}

// 生成匹配理由
function generateMatchReason(ans1: any, ans2: any): string {
  // ... 保持不变
}

export async function GET() {
  console.log('🚀 API开始执行');
  
  try {
    // 1. 检查session
    console.log('1. 获取session...');
    const session = await getServerSession(authOptions);
    console.log('session:', session);
    
    if (!session?.user?.id) {
      console.log('❌ 未登录');
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    
    const userId = parseInt(session.user.id);
    console.log('2. 用户ID:', userId);
    
    // 2. 查询用户答案
    console.log('3. 查询用户答案...');
    const userResult = await query('SELECT answers FROM users WHERE id = $1', [userId]);
    console.log('userResult:', userResult.rows);
    
    const userAnswers = userResult.rows[0]?.answers;
    
    if (!userAnswers) {
      console.log('4. 用户未完成测试');
      return NextResponse.json({ 
        matches: [],
        message: '请先完成价值观测试' 
      });
    }
    
    console.log('4. 用户答案:', userAnswers);
    
    // 3. 查询其他用户 - 直接使用 phone 字段
    console.log('5. 查询其他用户...');
    const othersResult = await query(
      'SELECT id, name, phone, answers FROM users WHERE id != $1 AND answers IS NOT NULL',
      [userId]
    );
    console.log('6. 找到其他用户:', othersResult.rows.length);
    
    // 4. 计算匹配度
    console.log('7. 开始计算匹配度...');
    const matches = othersResult.rows.map((other: any) => {
      const score = calculateMatchScore(userAnswers, other.answers);
      const reason = generateMatchReason(userAnswers, other.answers);
      return {
        id: other.id,
        name: other.name || other.phone,
        phone: other.phone,
        similarity: score,
        reason: reason
      };
    });
    
    // 按相似度排序，取前3个
    const topMatches = matches
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);
    
    // 5. 保存今天的匹配到数据库
    const today = new Date().toISOString().split('T')[0];
    console.log('7.5 保存匹配历史:', today);
    
    for (const match of topMatches) {
      try {
        await query(
          `INSERT INTO daily_matches (user_id, matched_user_id, similarity_score, date)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, matched_user_id, date) DO NOTHING`,
          [userId, match.id, match.similarity, today]
        );
        console.log(`   保存匹配: ${match.id} (${match.similarity}%)`);
      } catch (saveError) {
        console.error('保存匹配历史失败:', saveError);
        // 继续执行，不影响返回结果
      }
    }
    
    // 6. 返回结果
    console.log('8. 匹配结果:', topMatches);
    return NextResponse.json({ matches: topMatches });
    
  } catch (error) {
    console.error('❌ 获取匹配失败详细错误:', error);
    return NextResponse.json(
      { error: '获取失败', details: String(error) },
      { status: 500 }
    );
  }
}