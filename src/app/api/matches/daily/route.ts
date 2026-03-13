import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

// 计算匹配度（带权重）
function calculateMatchScore(answer1: any, answer2: any): number {
  if (!answer1 || !answer2) return 0;
  
  // 题目权重
  const weights: Record<number, number> = {
    1: 3, 2: 2, 3: 1, 4: 2, 5: 2, 6: 3, 7: 2, 8: 2, 9: 1, 10: 3,
    11: 2, 12: 3, 13: 2, 14: 3, 15: 2, 16: 3, 17: 2, 18: 2, 19: 2, 20: 3,
    21: 2, 22: 2, 23: 3, 24: 2, 25: 3, 26: 3, 27: 2, 28: 2, 29: 2, 30: 2,
    31: 2, 32: 2, 33: 1, 34: 2, 35: 1, 36: 2, 37: 2, 38: 2, 39: 2, 40: 1,
    41: 1, 42: 2, 43: 2, 44: 1, 45: 1, 46: 1, 47: 2, 48: 1, 49: 1, 50: 1,
    51: 1, 52: 2, 53: 2, 54: 2, 55: 2, 56: 2, 57: 2, 58: 3, 59: 1, 60: 2,
    61: 2, 62: 3, 63: 1, 64: 2, 65: 3, 66: 2
  };
  
  let totalScore = 0;
  let maxScore = 0;
  
  // 遍历所有题目
  for (let i = 1; i <= 66; i++) {
    const a1 = answer1[i];
    const a2 = answer2[i];
    const weight = weights[i] || 1;
    
    if (a1 && a2) {
      maxScore += 5 * weight;
      
      // 如果是数字（量表题）
      if (typeof a1 === 'number' && typeof a2 === 'number') {
        const diff = Math.abs(a1 - a2);
        const score = (5 - diff) * weight;
        totalScore += score;
      } 
      // 如果是字符串（单选题）
      else if (typeof a1 === 'string' && typeof a2 === 'string') {
        if (a1 === a2) {
          totalScore += 5 * weight;
        }
      }
      // 如果是数组（多选题）
      else if (Array.isArray(a1) && Array.isArray(a2)) {
        const intersection = a1.filter(v => a2.includes(v)).length;
        const union = new Set([...a1, ...a2]).size;
        const similarity = intersection / union; // 0-1 之间
        totalScore += similarity * 5 * weight;
      }
    }
  }
  
  return maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
}

// 生成匹配理由
function generateMatchReason(ans1: any, ans2: any): string {
  const commonPoints: string[] = [];
  
  if (!ans1 || !ans2) return '基于你们的价值观回答';
  
  // 1. 核心价值观共同点
  if (ans1[1] && ans2[1] && Array.isArray(ans1[1]) && Array.isArray(ans2[1])) {
    const common = ans1[1].filter((v: string) => ans2[1].includes(v));
    if (common.length >= 2) {
      commonPoints.push(`都重视「${common.slice(0, 3).join('、')}」`);
    } else if (common.length === 1) {
      commonPoints.push(`都重视「${common[0]}」`);
    }
  }
  
  // 2. 感情观 - 希望伴侣是灵魂知己还是生活搭档
  if (ans1[14] && ans2[14]) {
    // 确保是字符串再调用字符串方法
    const val1 = String(ans1[14]);
    const val2 = String(ans2[14]);
    
    if (val1 === val2) {
      if (val1 === '灵魂知己' || val1.includes('灵魂')) {
        commonPoints.push('都追求灵魂伴侣');
      } else if (val1 === '生活搭档' || val1.includes('生活')) {
        commonPoints.push('都看重生活默契');
      }
    }
  }
  
  // 3. 婚姻与孩子
  if (ans1[25] && ans2[25] && ans1[25] === ans2[25]) {
    const childOption = ans1[25];
    if (childOption === '不想要' || childOption.includes('不')) {
      commonPoints.push('都是丁克族');
    } else if (childOption === '1个' || childOption === '2个' || childOption.includes('个')) {
      commonPoints.push(`都想要${childOption}孩子`);
    }
  }
  
  // 4. 生活方式 - 作息
  if (ans1[33] && ans2[33]) {
    const diff = Math.abs(ans1[33] - ans2[33]);
    if (diff <= 1) {
      if (ans1[33] <= 2) {
        commonPoints.push('都是早睡早起型');
      } else if (ans1[33] >= 4) {
        commonPoints.push('都是夜猫子');
      }
    }
  }
  
  // 5. 消费观念
  if (ans1[37] && ans2[37]) {
    const diff = Math.abs(ans1[37] - ans2[37]);
    if (diff <= 1) {
      if (ans1[37] <= 2) {
        commonPoints.push('消费观念都很务实');
      } else if (ans1[37] >= 4) {
        commonPoints.push('都愿意为生活品质消费');
      }
    }
  }
  
  // 6. 社交偏好 - 宅家还是外出
  if (ans1[34] && ans2[34]) {
    const diff = Math.abs(ans1[34] - ans2[34]);
    if (diff <= 1) {
      if (ans1[34] <= 2) {
        commonPoints.push('都喜欢宅家');
      } else if (ans1[34] >= 4) {
        commonPoints.push('都爱社交');
      }
    }
  }
  
  if (commonPoints.length > 0) {
    return commonPoints.slice(0, 2).join('，') + '，很聊得来';
  }
  
  // 如果没有找到明显共同点，用匹配度说明
  const score = calculateMatchScore(ans1, ans2);
  if (score > 80) {
    return '价值观高度契合，值得深入聊聊';
  } else if (score > 60) {
    return '有相似的价值观基础';
  } else {
    return '性格互补，可能有新鲜感';
  }
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
    
    // 3. 查询其他用户
    console.log('5. 查询其他用户...');
    const othersResult = await query(
      'SELECT id, name, email as phone, answers FROM users WHERE id != $1 AND answers IS NOT NULL',
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