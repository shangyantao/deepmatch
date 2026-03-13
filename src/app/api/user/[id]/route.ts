import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }  // 改成 Promise
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }
  
  try {
    // 需要 await params
    const { id } = await params;
    const userId = parseInt(id);
    
    const result = await query(
      'SELECT id, name, email as phone FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('获取用户失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}