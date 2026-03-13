import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }
  
  try {
    const { answers } = await request.json();
    const userId = parseInt(session.user.id);
    
    await query(
      'UPDATE users SET answers = $1 WHERE id = $2',
      [JSON.stringify(answers), userId]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('保存问卷失败:', error);
    return NextResponse.json(
      { error: '保存失败' },
      { status: 500 }
    );
  }
}