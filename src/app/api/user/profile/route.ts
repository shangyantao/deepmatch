import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

// 获取当前用户资料
export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // 获取用户基本信息 - 直接使用 phone 字段
    const userResult = await query(
      `SELECT id, phone, name, avatar, gender, birthday, city, bio, answers, created_at
       FROM users WHERE id = $1`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }
    
    const user = userResult.rows[0];
    
    // 统计匹配次数（从 daily_matches 表）
    let matchesCount = 0;
    try {
      const matchesResult = await query(
        `SELECT COUNT(*) FROM daily_matches WHERE user_id = $1`,
        [userId]
      );
      matchesCount = parseInt(matchesResult.rows[0]?.count || '0');
    } catch (error) {
      console.log('daily_matches 表可能不存在，匹配次数统计为0');
    }
    
    // 统计消息总数
    let messagesCount = 0;
    try {
      const messagesResult = await query(
        `SELECT COUNT(*) FROM messages WHERE sender_id = $1 OR receiver_id = $1`,
        [userId]
      );
      messagesCount = parseInt(messagesResult.rows[0]?.count || '0');
    } catch (error) {
      console.log('messages 表可能不存在，消息总数统计为0');
    }
    
    return NextResponse.json({
      ...user,
      stats: {
        matches: matchesCount,
        messages: messagesCount,
        joinDate: user.created_at
      }
    });
  } catch (error) {
    console.error('获取用户资料失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

// 更新用户资料
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    const { name, gender, birthday, city, bio } = await request.json();
    
    const result = await query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           gender = COALESCE($2, gender),
           birthday = COALESCE($3, birthday),
           city = COALESCE($4, city),
           bio = COALESCE($5, bio)
       WHERE id = $6
       RETURNING id, phone, name, gender, birthday, city, bio`,
      [name, gender, birthday, city, bio, userId]
    );
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('更新用户资料失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}