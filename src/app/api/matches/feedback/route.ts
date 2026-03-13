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
    const { matchedUserId, feedback } = await request.json();
    const userId = parseInt(session.user.id);
    
    await query(
      `INSERT INTO match_feedback (user_id, matched_user_id, feedback)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, matched_user_id) 
       DO UPDATE SET feedback = $3, created_at = CURRENT_TIMESTAMP`,
      [userId, matchedUserId, feedback]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('保存反馈失败:', error);
    return NextResponse.json(
      { error: '保存失败' },
      { status: 500 }
    );
  }
}