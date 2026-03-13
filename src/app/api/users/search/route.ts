import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }
  
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  
  if (!q) {
    return NextResponse.json({ users: [] });
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    const result = await query(
      `SELECT id, name, phone 
       FROM users 
       WHERE id != $1 AND (phone ILIKE $2 OR name ILIKE $2)
       LIMIT 10`,
      [userId, `%${q}%`]
    );
    
    return NextResponse.json({ users: result.rows });
  } catch (error) {
    console.error('搜索用户失败:', error);
    return NextResponse.json({ error: '搜索失败' }, { status: 500 });
  }
}