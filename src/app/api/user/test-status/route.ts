import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }
  
  try {
    const userId = parseInt(session.user.id);
    
    const result = await query(
      'SELECT answers FROM users WHERE id = $1',
      [userId]
    );
    
    const answers = result.rows[0]?.answers;
    const completed = answers && Object.keys(answers).length >= 10; // 至少回答了10题
    
    return NextResponse.json({ completed });
  } catch (error) {
    console.error('检查测试状态失败:', error);
    return NextResponse.json(
      { error: '检查失败' },
      { status: 500 }
    );
  }
}